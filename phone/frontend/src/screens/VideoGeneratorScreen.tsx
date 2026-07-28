import React, { useState, useEffect, useRef } from 'react';
import { ScreenState, DownloadedItem } from '../types';
import { Header } from '../components/Header';
import { transcodeWebmToMp4 } from '../lib/videoEncoder';
import { Video, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VideoGeneratorScreenProps {
  item: DownloadedItem | null;
  onNavigate: (screen: ScreenState) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const VideoGeneratorScreen: React.FC<VideoGeneratorScreenProps> = ({
  item,
  onNavigate,
  showToast,
}) => {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'recording' | 'transcoding' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ayahs, setAyahs] = useState<{ number: number; text: string }[]>([]);
  const [progress, setProgress] = useState(0); // Transcoding or playback progress
  const [mp4BlobUrl, setMp4BlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!item?.parsed) {
      onNavigate('library');
      return;
    }
    
    // Fetch Arabic text
    const fetchText = async () => {
      setStatus('fetching');
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${item.parsed!.surahNum}`);
        const data = await res.json();
        if (data.code === 200) {
          const filtered = data.data.ayahs.filter(
            (a: any) => a.numberInSurah >= item.parsed!.startAyah && a.numberInSurah <= item.parsed!.endAyah
          );
          setAyahs(filtered.map((a: any) => ({ number: a.numberInSurah, text: a.text })));
          setStatus('idle');
        } else {
          throw new Error('Failed to fetch text');
        }
      } catch (err) {
        setErrorMsg('Error fetching Arabic text for the video.');
        setStatus('idle');
      }
    };
    
    fetchText();
  }, [item, onNavigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (mp4BlobUrl) URL.revokeObjectURL(mp4BlobUrl);
    };
  }, [mp4BlobUrl]);

  const drawFrame = (currentTime: number, duration: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#0a1226'; // Deep navy blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative border
    ctx.strokeStyle = '#d4af37'; // Gold
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Text settings
    ctx.fillStyle = '#f8f5ef'; // Cream text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(item?.surah?.englishName || `Surah ${item?.parsed?.surahNum}`, canvas.width / 2, 120);
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(item?.parsed?.reciter || '', canvas.width / 2, 170);

    // Determine current ayah to show
    // We don't have per-ayah timestamps, so we evenly distribute time across the number of ayahs
    if (ayahs.length > 0 && duration > 0) {
      const timePerAyah = duration / ayahs.length;
      const currentIndex = Math.min(Math.floor(currentTime / timePerAyah), ayahs.length - 1);
      const currentAyah = ayahs[currentIndex];

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif'; // In real app, use custom Arabic font
      
      // Basic text wrapping for Arabic text
      const words = currentAyah.text.split(' ');
      let line = '';
      let y = canvas.height / 2 - 100;
      const lineHeight = 80;

      // Reverse words for basic RTL rendering on canvas (since basic canvas fillText might struggle with complex RTL text wrapping)
      words.reverse().forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 100 && line !== '') {
          ctx.fillText(line, canvas.width / 2, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, canvas.width / 2, y);

      // Ayah number
      ctx.fillStyle = '#d4af37';
      ctx.font = '30px sans-serif';
      ctx.fillText(`Ayah ${currentAyah.number}`, canvas.width / 2, y + lineHeight + 40);
    }

    // Progress bar at bottom
    ctx.fillStyle = '#ffffff33';
    ctx.fillRect(40, canvas.height - 80, canvas.width - 80, 10);
    ctx.fillStyle = '#d4af37';
    const progressWidth = duration > 0 ? (currentTime / duration) * (canvas.width - 80) : 0;
    ctx.fillRect(40, canvas.height - 80, progressWidth, 10);
  };

  const startGeneration = async () => {
    if (!canvasRef.current || !audioRef.current || ayahs.length === 0) return;
    
    setStatus('recording');
    setErrorMsg(null);
    setProgress(0);
    chunksRef.current = [];

    const canvas = canvasRef.current;
    const audio = audioRef.current;
    
    // Set up Audio Context and capture stream
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    
    // Resume context if needed
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Disconnect previous if exists, though we should only create once per element
    const source = audioCtx.createMediaElementSource(audio);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination); // Hear it while recording

    // Capture Canvas stream at 30 FPS
    const canvasStream = canvas.captureStream(30);
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    // Set up MediaRecorder
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm'; // fallback
    }
    
    const recorder = new MediaRecorder(canvasStream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const webmBlob = new Blob(chunksRef.current, { type: mimeType });
      setStatus('transcoding');
      
      try {
        const mp4Blob = await transcodeWebmToMp4(webmBlob, ({ ratio }) => {
          setProgress(Math.round(ratio * 100));
        });
        const url = URL.createObjectURL(mp4Blob);
        setMp4BlobUrl(url);
        setStatus('done');
        showToast('success', 'Video generated successfully!');
      } catch (err) {
        console.error("Transcode error:", err);
        setErrorMsg('Failed to process video format. (FFmpeg Wasm Error)');
        setStatus('idle');
      }
    };

    // Animation loop
    const loop = () => {
      if (audio.duration) {
        setProgress(Math.round((audio.currentTime / audio.duration) * 100));
      }
      drawFrame(audio.currentTime, audio.duration || 0);
      animationRef.current = requestAnimationFrame(loop);
    };

    // Play and record
    audio.currentTime = 0;
    recorder.start(1000); // chunk every 1s
    
    try {
      await audio.play();
      loop();
    } catch (e) {
      setErrorMsg('Failed to play audio for recording.');
      setStatus('idle');
    }
  };

  // When audio finishes, stop recording
  const handleAudioEnded = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (!mp4BlobUrl) return;
    const a = document.createElement('a');
    a.href = mp4BlobUrl;
    a.download = `${item?.parsed?.surahNum}_${item?.parsed?.reciter}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <Header
        title="Video Generator"
        subtitle="Create an MP4 for sharing"
        onNavigate={onNavigate}
        showBack={true}
        onBack={() => {
          if (status === 'recording' || status === 'transcoding') {
            showToast('error', 'Please wait for the process to finish.');
          } else {
            onNavigate('library');
          }
        }}
      />

      <main className="flex-1 px-4 pt-4 max-w-md mx-auto w-full flex flex-col items-center">
        {errorMsg && (
          <div className="mb-4 p-3 w-full rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{errorMsg}</p>
          </div>
        )}

        {/* Hidden Audio Element */}
        {item?.url && (
          <audio 
            ref={audioRef} 
            src={item.url} 
            onEnded={handleAudioEnded}
            crossOrigin="anonymous" // needed for MediaElementSource
          />
        )}

        {/* The Video Preview / Generation Canvas */}
        <div className="relative w-full aspect-[9/16] max-w-[280px] bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 border border-border">
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            className="w-full h-full object-contain"
          />
          
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <button 
                onClick={startGeneration}
                disabled={ayahs.length === 0}
                className="w-16 h-16 rounded-full bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center active-scale disabled:opacity-50"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            </div>
          )}

          {status === 'recording' && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full backdrop-blur-md animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Recording {progress}%</span>
            </div>
          )}

          {status === 'transcoding' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <h3 className="text-sm font-bold text-fg mb-1">Encoding MP4</h3>
              <p className="text-xs text-fg-muted">Optimizing video for sharing...</p>
              <div className="w-48 h-1.5 bg-surface-2 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-accent mt-2 font-mono">{progress}%</p>
            </div>
          )}

          {status === 'done' && mp4BlobUrl && (
            <div className="absolute inset-0 bg-black">
              <video src={mp4BlobUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full space-y-3">
          {status === 'fetching' && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
              <p className="text-xs text-fg-muted">Fetching Arabic verses...</p>
            </div>
          )}

          {status === 'done' && (
            <button
              onClick={downloadVideo}
              className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active-scale"
            >
              <Video className="w-4 h-4" />
              Save Video to Device
            </button>
          )}

          {status === 'done' && (
            <button
              onClick={() => {
                setStatus('idle');
                setMp4BlobUrl(null);
                setProgress(0);
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-fg border border-border font-semibold text-sm active-scale"
            >
              Create Another
            </button>
          )}
          
          <p className="text-[10px] text-center text-fg-muted px-4 leading-relaxed">
            Note: This process runs entirely on your device. Video generation takes time equivalent to the audio length, plus a few moments for MP4 encoding.
          </p>
        </div>
      </main>
    </div>
  );
};

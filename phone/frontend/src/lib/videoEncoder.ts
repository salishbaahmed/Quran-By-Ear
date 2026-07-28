import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (onProgress: (p: { ratio: number }) => void) => {
  if (ffmpeg) return ffmpeg;

  const instance = new FFmpeg();
  instance.on('progress', onProgress);

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await instance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpeg = instance;
  return ffmpeg;
};

export const transcodeWebmToMp4 = async (
  webmBlob: Blob,
  onProgress: (p: { ratio: number }) => void
): Promise<Blob> => {
  const ffmpegInstance = await loadFFmpeg(onProgress);
  
  // Write the file to memory
  await ffmpegInstance.writeFile('input.webm', await fetchFile(webmBlob));
  
  // Execute the transcode command
  // We use libx264 for universal compatibility, aac for audio
  await ffmpegInstance.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-c:a', 'aac',
    'output.mp4'
  ]);
  
  // Read the output
  const data = await ffmpegInstance.readFile('output.mp4');
  
  // Delete memory files
  await ffmpegInstance.deleteFile('input.webm');
  await ffmpegInstance.deleteFile('output.mp4');
  
  return new Blob([data], { type: 'video/mp4' });
};

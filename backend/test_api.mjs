import https from 'node:https';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'QuranByEar/2.0' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

// Get ALL reciters from the detailed endpoint
console.log('=== Full reciter list ===');
const reciters = await get('https://api.quran.com/api/v4/resources/recitations?language=en');
for (const r of reciters.recitations) {
  console.log(`ID:${r.id} | ${r.reciter_name} | ${r.style}`);
}

// Get audio URL for a few reciters to understand slug pattern
console.log('\n=== Chapter audio URL pattern for first 3 reciters ===');
for (const r of reciters.recitations.slice(0, 5)) {
  const chap = await get(`https://api.quran.com/api/v4/chapter_recitations/${r.id}/1`);
  console.log(`Reciter ${r.id} (${r.reciter_name}): ${chap?.audio_file?.audio_url}`);
}

// Also test verse timings
console.log('\n=== Verse timings for surah 1 (used by VideoGenerator) ===');
const timings = await get('https://api.quran.com/api/v4/verses/by_chapter/1?audio=7&fields=text_uthmani,verse_key');
console.log('Timings response keys:', Object.keys(timings));
console.log('First verse:', JSON.stringify(timings.verses?.[0], null, 2));

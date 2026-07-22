const request = require('supertest');
const app = require('../server');

describe('Backend API Endpoints', () => {
    it('should return a list of reciters', async () => {
        const response = await request(app).get('/api/reciters');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('reciters');
        expect(Array.isArray(response.body.reciters)).toBeTruthy();
        
        // Since B:\Quran is populated, there should be some reciters
        expect(response.body.reciters.length).toBeGreaterThan(0);
    });

    it('should redirect an individual Ayah MP3 to the dataset host', async () => {
        // Using Abdulbasit_Abdussamad, Surah 1, Ayah 1
        const response = await request(app)
            .get('/api/audio')
            .query({ reciter: 'Abdulbasit_Abdussamad', surah: 1, ayah: 1 });
            
        expect(response.status).toBe(302);
        expect(response.headers.location).toMatch(/\/Abdulbasit_Abdussamad\/001001\.mp3$/);
    });

    it('should return 400 if missing parameters for audio endpoint', async () => {
        const response = await request(app)
            .get('/api/audio')
            .query({ reciter: 'Abdulbasit_Abdussamad' }); // missing surah and ayah
            
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

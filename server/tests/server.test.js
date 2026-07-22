const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const db = require('../database');

describe('Backend API Endpoints with Auth and FFMPEG', () => {
    let token = '';

    beforeAll((done) => {
        // Clear users table for test
        db.run('DELETE FROM users', () => {
            // Create a test user and login to get a token
            request(app)
                .post('/api/auth/signup')
                .send({ username: 'testuser', password: 'password123' })
                .end((err, res) => {
                    request(app)
                        .post('/api/auth/login')
                        .send({ username: 'testuser', password: 'password123' })
                        .end((err, loginRes) => {
                            token = loginRes.body.accessToken;
                            done();
                        });
                });
        });
    });

    it('should return 401 if missing token on protected route', async () => {
        const response = await request(app).get('/api/reciters');
        expect(response.status).toBe(401);
    });

    it('should return a list of reciters when authenticated', async () => {
        const response = await request(app)
            .get('/api/reciters')
            .set('Authorization', `Bearer ${token}`);
            
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('reciters');
        expect(Array.isArray(response.body.reciters)).toBe(true);
    });

    it('should return 400 if missing parameters for download endpoint', async () => {
        const response = await request(app)
            .get('/api/download')
            .set('Authorization', `Bearer ${token}`)
            .query({ reciter: 'Abdulbasit_Abdussamad' }); // missing surah, startAyah, endAyah
            
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('should generate concatenated MP3 successfully', async () => {
        // Using Abdulbasit_Abdussamad, Surah 1, Ayahs 1 to 2
        // We assume these files exist in B:\Quran for the test to pass
        const response = await request(app)
            .get('/api/download')
            .set('Authorization', `Bearer ${token}`)
            .query({ reciter: 'Abdulbasit_Abdussamad', surah: 1, startAyah: 1, endAyah: 2 });
            
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/audio|mpeg|octet-stream/i);
        expect(response.headers['content-disposition']).toContain('attachment; filename="Surah_1_Ayahs_1-2_Abdulbasit_Abdussamad.mp3"');
    });
});

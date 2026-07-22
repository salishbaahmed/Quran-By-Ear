# Backend Documentation

This document outlines the architecture, setup instructions, and design patterns for the backend of the Quran-By-Ear project. It serves as a guide for backend developers and devops engineers working on deployment.

## 1. Architecture Overview

The backend is built using **Node.js** and **Express**. Its primary role is to serve as a lightweight API gateway and orchestrator, decoupled from the heavy lifting of audio file streaming.

### Decoupled Dataset Hosting
To ensure scalability, the raw MP3 files are **not** streamed through the Express API. 
Instead, the architecture relies on a **Dataset Host** (a public CDN like AWS S3 or a local static file server during development).
- The Express server (`server.js`) simply computes the correct file path and issues an **HTTP 302 Redirect** pointing the client directly to the Dataset Host.
- This prevents the Node server from becoming a bottleneck when multiple users are streaming audio simultaneously.

## 2. Environment Configuration (`.env`)

The server relies on the following environment variables. In production, these should be securely injected (e.g. via Docker secrets or CI/CD pipelines).

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3000` | The port the Express server binds to. |
| `DATASET_PATH` | `B:\Quran` | Absolute path to the dataset folder. Used by `/api/reciters` to scan directories and find available reciters. |
| `DATASET_HOST_URL` | `http://DESKTOP-85K359Q.local:8080` | The base URL of the public dataset host. Used for constructing 302 Redirects. |

## 3. Scripts and Tooling (`package.json`)

| Command | Description |
|---|---|
| `npm start` | Starts the Express server (`node server.js`). |
| `npm run serve-dataset` | Starts a local `http-server` on port `8080` pointing to `B:\Quran` (with CORS enabled). Use this for local development. |
| `npm test` | Runs the automated Jest & Supertest testing suite. |

## 4. Local Development Workflow

To fully simulate the production environment locally:

1. **Start the Dataset Host (CDN Simulator):**
   ```bash
   cd backend
   npm run serve-dataset
   ```
2. **Start the API Server:**
   Open a second terminal window:
   ```bash
   cd backend
   npm start
   ```

## 5. Testing Strategy

We use **Jest** and **Supertest** for automated integration testing.
- The tests are located in `backend/tests/server.test.js`.
- During testing, the `server.js` file is imported directly without starting the `app.listen()` block. This avoids `EADDRINUSE` port collision errors and allows Jest to rapidly mock requests.
- All new API routes must have coverage for both successful returns and expected edge cases (e.g. 400 Bad Request for missing data).

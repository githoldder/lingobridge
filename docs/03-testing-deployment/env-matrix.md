# Deployment Environment Variable Matrix

This matrix documents LingoBridge environment variables across the three main deployment routes (Local, Vercel, Tencent Direct) and outlines the difference between Frontend Build-Time variables and Backend Runtime variables.

---

## 1. Frontend Build-Time vs Backend Runtime

* **Frontend Build-Time Variables**: Prefixed with `VITE_`. These are compiled directly into frontend JS bundles during the `npm run build` process. Changing these in `.env` **requires a rebuild** of the frontend to take effect.
* **Backend Runtime Variables**: Loaded dynamically by the Express server process. Changing these only requires a server restart, not a build.

---

## 2. Environment Matrix Table

| Variable Name | Environment Layer | Localhost | Vercel Lane | Tencent Direct | Purpose |
|---|---|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend Build-Time | `http://localhost:3001/api/v1` | *Left Blank* (uses proxy rewrite) | `http://101.34.72.227/api/v1` | Sets target backend API host |
| `HOST` | Backend Runtime | `127.0.0.1` | N/A | `0.0.0.0` | Backend bind address |
| `PORT` | Backend Runtime | `3001` | N/A | `3001` | Backend port number |
| `JWT_SECRET` | Backend Runtime | `demo-secret` | N/A | *Secure Custom Value* | Signs user identity JWT tokens |
| `TENCENT_TTS_SECRET_ID` | Backend Runtime | *Optional* | N/A | *Optional* | Tencent Cloud ASR/TTS auth |
| `TENCENT_TTS_SECRET_KEY`| Backend Runtime | *Optional* | N/A | *Optional* | Tencent Cloud ASR/TTS auth |

---

## 3. VITE_API_BASE_URL Routing Details

1. **Localhost Lane**: Defaults to `http://localhost:3001/api/v1`. Since the frontend and backend run locally on separate ports, this direct link bridges them perfectly.
2. **Vercel Lane (HTTPS)**: By leaving `VITE_API_BASE_URL` **blank or set to `/api/v1`**, the React frontend makes relative calls. Vercel's edge router intercepts `/api/v1/*` requests and proxies them directly to Tencent Cloud via rules in `vercel.json`. This completely avoids browser CORS blocking.
3. **Tencent Direct Lane (HTTP)**: Configured explicitly to target the domestic server IP: `http://101.34.72.227/api/v1` to ensure direct connection bypassing intermediate proxies.

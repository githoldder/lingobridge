# Local Demo Runbook (演示兜底使用手册)

This runbook provides the definitive guide to setting up and running LingoBridge locally. Since browsers enforce strict secure-context boundaries, running on `localhost` acts as the primary full-media and large-upload fallback for the presentation.

---

## 1. Why Localhost is the Ultimate Fallback

1. **Secure Browser Context**: Browsers only permit camera, microphone, and screen share access over `localhost` or verified `HTTPS` origins.
2. **Zero Upload Bottlenecks**: Unlike Vercel, which limits rewrites/proxies and throws `502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR` for large courseware, localhost handles large direct multipart uploads (20MB+) instantly.
3. **No External Network Risk**: Ensures the presentation remains stable even if external hosting or internet connectivity degrades.

---

## 2. Local Environment Requirements

Before launching, ensure your local system has:
* **Node.js** (v18 or v20 recommended)
* **PostgreSQL** (Optional - if testing database mode; otherwise default memory/JSON mode handles the demo perfectly)
* **Docker / Docker Compose** (For testing localized containerization)

---

## 3. Quick-Start Execution Flow

Follow these steps to run the complete LingoBridge stack locally:

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Start the Backend Service
The local mock server runs on port `3001` by default:
```bash
# Starts local mock server with DB_MODE=json
npm run backend
```
Verify health check returns `200`:
```bash
curl -sS http://127.0.0.1:3001/api/v1/health
```

### Step 3: Start the Frontend App
Open a separate terminal window and launch the Vite React server:
```bash
npm run dev
```
Vite will host the frontend at: `http://localhost:5173`.

---

## 4. Smoke Verification Steps

To ensure everything is fully functional before presenting:

1. **Secure Login**:
   - Open `http://localhost:5173` in Chrome/Edge/Safari.
   - Click "Login" and input standard demo credentials:
     * **Teacher Account**: `teacher@czu.edu` / `teacher123`
     * **Student Account**: `student@czu.edu` / `student123`
2. **Media Permissions Check**:
   - Enter a live session classroom.
   - Click the microphone/camera buttons in the toolbar.
   - **Verification**: The browser should successfully prompt for hardware authorization (Green camera/mic icons appear).
3. **Courseware Multipart Upload**:
   - Navigate to the **Courseware** tab.
   - Select a lesson node, choose a sample file (e.g. `tests/samples/pdf/test.pdf` or a large PowerPoint file), and click upload.
   - **Verification**: Ensure the file completes upload rapidly and lists in the documents view.

---

## 5. References & Links
* DevOps Smoke Manual: [.agent/workflows/devops-smoke-test.md](file:///Users/caolei/Desktop/LingoBridge/.agent/workflows/devops-smoke-test.md)
* Deployment Boundaries: [.agent/rules/deployment-boundaries.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/deployment-boundaries.md)

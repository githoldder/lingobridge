# Overseas Vercel HTTPS Runbook (Vercel HTTPS 演示手册)

This document details the configuration, deployment boundaries, and smoke-testing procedures for the Vercel HTTPS hosting route. Vercel acts as the primary external showcase path for frontend static rendering, global SSL security, and browser camera/mic permissions.

---

## 1. Role of the Vercel HTTPS Lane

* **Global Accessibility**: Distributes the React-based Vite frontend globally via Vercel Edge Networks.
* **Auto-Provisioned SSL**: Provides secure contexts (`https://<domain>.vercel.app`) natively, allowing simple external demonstrations of camera, microphone, and browser-dependent media permissions.
* **API Proxying**: Uses Vercel rewrites to proxy backend API requests smoothly to the primary Tencent Cloud host.

---

## 2. Hard Boundary: The 20MB+ Upload Limitation

> [!CAUTION]
> **DO NOT present large courseware uploads (20MB+) on the Vercel pathway.**
> While direct uploads to the domestic Tencent Cloud IP succeed instantly, uploads routed through the Vercel overseas proxy frequently time out or fail with:
> `502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR`
>
> This is a platform routing limitation caused by cross-border latency and Vercel Router's request payload constraints, not a bug in LingoBridge source code.

### Recommended Demo Behavior:
* **Preloaded Assets**: For the final presentation, use pre-existing courseware and homework assets configured inside the system.
* **Small PDFs**: If a live upload must be shown on this lane, limit the file size to under **2MB**.
* **Direct Upload Showcase**: If demonstrating large file uploads (such as a 27MB PPTX or PDF), explicitly switch your browser tab to the **Tencent Cloud Direct** route or a **localhost** environment.

---

## 3. Configuration & Deployment

### Environment Variables
For Vercel production:
* `VITE_API_BASE_URL`: Left blank or configured to `/api/v1` to let Vercel rewrite rules dynamically handle requests (defined in `vercel.json`).

### File Upload Routing Definition in `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "http://101.34.72.227/api/v1/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

---

## 4. Smoke Verification Procedures

To check the health of the Vercel deploy:
1. **Frontend Load**: Navigate to your specific Vercel URL (e.g., `https://lingobridge-lake.vercel.app`). Verify the home dashboard loads.
2. **API Handshake**: Access `<VERCEL_URL>/api/v1/health` and verify the backend responds with a standard healthy JSON package.
3. **Login Smoke**: Log in as a teacher/student to verify credentials correctly route to the domestic database.
4. **Media Permission Smoke**: Open a live room session and confirm the browser displays a green checkmark requesting mic/cam hardware permission.

---

## 5. References & Links
* Boundary Definitions: [.agent/rules/deployment-boundaries.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/deployment-boundaries.md)
* DevOps Smoke Manual: [.agent/workflows/devops-smoke-test.md](file:///Users/caolei/Desktop/LingoBridge/.agent/workflows/devops-smoke-test.md)

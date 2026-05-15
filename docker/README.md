# Docker

Docker is the post-local-verification packaging path. During local simulation and E2E, use PM2 first so ports and long-running processes are explicit and inspectable.

Local order:

1. `npm run build`
2. `npm run pm2:start`
3. Verify `127.0.0.1:3001` and `127.0.0.1:4173`
4. Run headed Playwright CLI E2E
5. Package with Docker
6. Deploy and mount services with Tencent Cloud CLI

Deployment assets:

- `docker-compose.yml` or environment-specific compose files.
- Nginx config under `docker/nginx/`.
- Upload-size and `/api` proxy configuration.

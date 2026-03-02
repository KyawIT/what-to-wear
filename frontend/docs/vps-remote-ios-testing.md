# VPS Remote iPhone Testing (Expo Tunnel)

This runbook is tailored to your server path:

- Project root: `/app/deploy/what-to-wear`
- Frontend: `/app/deploy/what-to-wear/frontend`

The setup runs Expo Metro in a persistent `systemd` service and exposes it via Expo tunnel with a fixed subdomain.

## 1) One-time server prerequisites

```bash
apt update
apt install -y curl git tmux build-essential
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm alias default 20
```

## 2) Install frontend dependencies

```bash
cd /app/deploy/what-to-wear/frontend
npm run vps:install-deps
```

Why this command: it forces `npm ci --legacy-peer-deps` so React 19 + `lucide-react-native` peer mismatch does not block VPS installs.

## 3) Create and validate `.env.vps`

```bash
cd /app/deploy/what-to-wear/frontend
cp .env.vps.example .env.vps
```

Edit `.env.vps` and set real values:

- `EXPO_TOKEN` from Expo account settings
- `EXPO_TUNNEL_SUBDOMAIN` unique globally
- All `EXPO_PUBLIC_*` URLs as public URLs (no localhost)

Validate:

```bash
npm run vps:validate-env -- .env.vps
```

## 4) Install/start systemd service

Run as `root`:

```bash
cd /app/deploy/what-to-wear/frontend
APP_DIR=/app/deploy/what-to-wear/frontend RUN_AS_USER=root npm run vps:install-service
```

Useful overrides:

- `SERVICE_NAME=wtw-expo`
- `EXPO_PORT=8081`
- `EXPO_USE_DEV_CLIENT=1` (recommended)
- `NODE_MAJOR=20`

## 5) Check service and logs

```bash
systemctl status wtw-expo
journalctl -u wtw-expo -f
```

You should see Expo start with tunnel URL output.

## 6) Connect from iPhone

- Recommended for this project: iOS development client (`eas build -p ios --profile development`) because native plugins are configured.
- Open the tunnel URL using the dev client app.
- Expo Go is only a fallback if all native modules are compatible.

## 7) Update workflow after pulling code

```bash
cd /app/deploy/what-to-wear/frontend
git pull
npm run vps:install-deps
systemctl restart wtw-expo
journalctl -u wtw-expo -n 100 --no-pager
```

## Troubleshooting

- Service fails immediately:
  - Run `npm run vps:validate-env -- .env.vps`.
  - Ensure `EXPO_TOKEN` and `EXPO_TUNNEL_SUBDOMAIN` are set.
- `npm ci` fails with `ERESOLVE` on `lucide-react-native`:
  - Use `npm run vps:install-deps` (or `npm ci --legacy-peer-deps`).
  - If you copy files with `frontend/*`, dotfiles are skipped; copy `.npmrc` explicitly or use the script above.
- iPhone can open app but API calls fail:
  - Check `EXPO_PUBLIC_BACKEND_ROOT` and auth URLs are public and reachable.
- `nvm` not found in service:
  - Ensure Node is installed for `RUN_AS_USER` and `NODE_MAJOR` matches installed version.

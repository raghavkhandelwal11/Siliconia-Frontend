#!/usr/bin/env bash
# Brings up the whole prototype for nightly checks on a CI runner: the backend
# stack from Siliconia_Backend (checked out at ./backend) with demo data and an
# admin, plus this web app as a production build on :3000 behind Caddy (:8080).
set -euo pipefail
cd "$(dirname "$0")/.."
ENV=backend/deploy/compose/.env
cp backend/deploy/compose/.env.example "$ENV"
key=$(openssl rand -hex 24)
set_env() { # replace KEY=... in place, or add it
  if grep -q "^$1=" "$ENV"; then sed -i "s|^$1=.*|$1=$2|" "$ENV"; else echo "$1=$2" >> "$ENV"; fi
}
set_env INTERNAL_API_KEY "$key"
# Every request comes from the runner's one address, so the per-visitor limit
# would throttle the tests themselves. Sign-in code limits stay as they are.
set_env RATELIMIT_GUEST_PER_MINUTE "${GUEST_LIMIT:-100000}"
set_env SIM_SHIP_SPEED 5s
(cd backend && make up && make demo && make admin PHONE=9999900002 NAME="E2E Admin")
until curl -sf http://localhost:8080/api/v1/readyz >/dev/null; do sleep 3; done

npm ci
npm run build
INTERNAL_API_KEY="$key" BACKEND_URL=http://localhost:8080 nohup npm start -- -p 3000 >/tmp/web.log 2>&1 &
until curl -sf -o /dev/null http://localhost:8080/; do sleep 3; done
echo "stack ready on http://localhost:8080"

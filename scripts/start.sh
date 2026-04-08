#!/bin/bash
# Gemma 4 31B + Open WebUI 시작 스크립트
# 사전 조건: Vast.ai 인스턴스가 이미 running 상태

set -e

# 설정
VAST_SSH_HOST="${1:-ssh1.vast.ai}"
VAST_SSH_PORT="${2:-29110}"
LOCAL_API_PORT=8000
LOCAL_UI_PORT=3000

echo "=== Gemma 4 31B + Open WebUI 시작 ==="

# 1. SSH 터널 시작
echo "[1/3] SSH 터널 설정 (localhost:${LOCAL_API_PORT} → Vast.ai:${LOCAL_API_PORT})"
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
  -N -L ${LOCAL_API_PORT}:localhost:${LOCAL_API_PORT} \
  -p ${VAST_SSH_PORT} root@${VAST_SSH_HOST} &
TUNNEL_PID=$!
echo "  터널 PID: ${TUNNEL_PID}"
sleep 3

# 2. 터널 확인
echo "[2/3] API 연결 확인..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${LOCAL_API_PORT}/v1/models | grep -q 200; then
  echo "  API 연결 성공"
else
  echo "  API 연결 실패. Vast.ai 서버에서 llama-server가 실행 중인지 확인하세요."
  kill ${TUNNEL_PID} 2>/dev/null
  exit 1
fi

# 3. Open WebUI 시작
echo "[3/3] Open WebUI 시작..."
docker start open-webui 2>/dev/null || \
docker run -d -p ${LOCAL_UI_PORT}:8080 \
  -e OPENAI_API_KEY=dummy \
  -e OPENAI_API_BASE_URL=http://host.docker.internal:${LOCAL_API_PORT}/v1 \
  -e ENABLE_SIGNUP=true \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --add-host=host.docker.internal:host-gateway \
  ghcr.io/open-webui/open-webui:main

echo ""
echo "=== 시작 완료 ==="
echo "Open WebUI: http://localhost:${LOCAL_UI_PORT}"
echo "API:        http://localhost:${LOCAL_API_PORT}/v1"
echo "터널 PID:   ${TUNNEL_PID}"
echo ""
echo "종료 시: bash scripts/stop.sh ${TUNNEL_PID}"

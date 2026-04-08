#!/bin/bash
# Gemma 4 31B + Open WebUI 종료 스크립트

set -e

TUNNEL_PID="${1}"
INSTANCE_ID="${2}"

echo "=== Gemma 4 31B + Open WebUI 종료 ==="

# 1. Open WebUI 중지
echo "[1/3] Open WebUI 중지..."
docker stop open-webui 2>/dev/null && echo "  중지 완료" || echo "  이미 중지됨"

# 2. SSH 터널 종료
echo "[2/3] SSH 터널 종료..."
if [ -n "${TUNNEL_PID}" ]; then
  kill ${TUNNEL_PID} 2>/dev/null && echo "  터널 종료 (PID: ${TUNNEL_PID})" || echo "  이미 종료됨"
else
  # PID 미지정 시 모든 SSH 터널 종료
  pkill -f "ssh.*-L.*8000:localhost:8000" 2>/dev/null && echo "  터널 종료" || echo "  터널 없음"
fi

# 3. Vast.ai 인스턴스 삭제 (선택)
if [ -n "${INSTANCE_ID}" ]; then
  echo "[3/3] Vast.ai 인스턴스 삭제 (ID: ${INSTANCE_ID})..."

  # .env에서 API 키 로드
  if [ -f .env ]; then
    export VAST_API_KEY=$(grep VAST_API_KEY .env | cut -d'=' -f2 | cut -d'#' -f1 | tr -d ' ')
  fi

  vastai destroy instance ${INSTANCE_ID}
  echo "  인스턴스 삭제 완료"

  # 확인
  echo "  실행 중인 인스턴스 확인:"
  vastai show instances
else
  echo "[3/3] 인스턴스 ID 미지정 - Vast.ai 인스턴스는 수동 삭제 필요"
  echo "  vastai destroy instance <INSTANCE_ID>"
fi

echo ""
echo "=== 종료 완료 ==="

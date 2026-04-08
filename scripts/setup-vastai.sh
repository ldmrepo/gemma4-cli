#!/bin/bash
# Vast.ai 인스턴스에서 llama.cpp + Gemma 4 31B 설정 스크립트
# 사용법: 인스턴스 생성 후 SSH 접속하여 실행

set -e

MODEL_REPO="unsloth/gemma-4-31B-it-GGUF"
MODEL_FILE="gemma-4-31B-it-Q8_0.gguf"
MODEL_DIR="/tmp/models"
LLAMA_DIR="/tmp/llama.cpp"
PORT=8000

echo "=== Gemma 4 31B 서버 설정 ==="

# 1. 빌드 의존성 설치
echo "[1/5] 빌드 의존성 설치..."
apt-get update -qq
apt-get install -y -qq cmake build-essential git libcurl4-openssl-dev
pip install cmake --upgrade -q

# CUDA 버전에 맞는 cuBLAS 설치
CUDA_VER=$(nvcc --version | grep release | sed 's/.*release //' | sed 's/,.*//' | sed 's/\./\-/')
apt-get install -y -qq libcublas-dev-${CUDA_VER} 2>/dev/null || \
apt-get install -y -qq libcublas-dev 2>/dev/null || \
echo "  cuBLAS 수동 설치 필요"

# 2. llama.cpp 빌드
echo "[2/5] llama.cpp 빌드..."
cd /tmp
git clone --depth 1 https://github.com/ggml-org/llama.cpp.git
cd ${LLAMA_DIR}
cmake -B build -DGGML_CUDA=ON -DLLAMA_CURL=ON
cmake --build build --config Release -j$(nproc) -- llama-server
echo "  빌드 완료: ${LLAMA_DIR}/build/bin/llama-server"

# 3. 모델 다운로드
echo "[3/5] GGUF 모델 다운로드 (${MODEL_FILE})..."
huggingface-cli download ${MODEL_REPO} ${MODEL_FILE} --local-dir ${MODEL_DIR}
echo "  다운로드 완료: ${MODEL_DIR}/${MODEL_FILE}"

# 4. GPU 확인
echo "[4/5] GPU 정보:"
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader

# 5. 서버 시작
echo "[5/5] llama-server 시작 (port ${PORT})..."
nohup ${LLAMA_DIR}/build/bin/llama-server \
  -m ${MODEL_DIR}/${MODEL_FILE} \
  --host 0.0.0.0 \
  --port ${PORT} \
  -ngl 999 \
  -c 262144 \
  > /tmp/llama.log 2>&1 &

echo "  서버 PID: $!"
sleep 5
tail -5 /tmp/llama.log

echo ""
echo "=== 설정 완료 ==="
echo "API: http://localhost:${PORT}/v1"
echo "로그: tail -f /tmp/llama.log"

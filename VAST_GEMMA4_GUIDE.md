# Vast.ai + Gemma 4 31B Dense + Open WebUI 구성 가이드

## 개요

Vast.ai 원격 GPU에서 Gemma 4 31B Dense (Q8_0) 모델을 llama.cpp로 서빙하고,
로컬 PC에서 Open WebUI로 접속하여 채팅하는 구성.

```
[Vast.ai GPU 서버]                    [로컬 PC - Windows 11]
 llama-server                          Open WebUI
 Gemma 4 31B Q8_0         ←SSH터널→   http://localhost:3000
 port 8000                             SSH tunnel → localhost:8000
```

## 실행 환경 (2026-04-08 기준)

| 항목 | 값 |
|------|-----|
| GPU | NVIDIA RTX PRO 6000 Blackwell WS (96GB VRAM) |
| 모델 | unsloth/gemma-4-31B-it-Q8_0.gguf (31GB) |
| 양자화 | Q8_0 |
| 추론 속도 | ~43.8 tok/s |
| 비용 | ~$1.26/hr |
| 서빙 | llama.cpp server (CUDA) |
| UI | Open WebUI (Docker) |

## 사전 준비

```bash
# 로컬 PC에 필요한 도구
pip install vastai          # Vast.ai CLI
docker --version            # Docker Desktop 필요
```

## Phase 1: Vast.ai 인스턴스 생성

```bash
# API 키 설정
export VAST_API_KEY=<YOUR_VAST_API_KEY>

# GPU 검색 (48GB+ VRAM, 성능순)
vastai search offers 'gpu_ram>=48 num_gpus=1 reliability>0.95 inet_down>200 dph<=1.50' -o 'dlperf-' --limit 10

# 인스턴스 생성 (vLLM 이미지 사용 - 기본 CUDA 환경 제공)
vastai create instance <OFFER_ID> --image vllm/vllm-openai:latest --disk 120

# 상태 확인 (running 될 때까지)
vastai show instance <INSTANCE_ID>
```

## Phase 2: llama.cpp 빌드 + 모델 다운로드

> vLLM 0.19.0은 Gemma 4 아키텍처를 지원하지 않으므로 llama.cpp 사용

```bash
# SSH 접속
ssh -o StrictHostKeyChecking=no -p <PORT> root@<SSH_HOST>

# 빌드 의존성 설치
apt-get update -qq
apt-get install -y -qq cmake build-essential git libcurl4-openssl-dev libcublas-dev-12-9
pip install cmake --upgrade

# llama.cpp 빌드
cd /tmp
git clone --depth 1 https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
cmake -B build -DGGML_CUDA=ON -DLLAMA_CURL=ON
cmake --build build --config Release -j$(nproc) -- llama-server
# 빌드 시간: 약 5~10분

# GGUF 모델 다운로드 (병렬 실행 가능)
huggingface-cli download unsloth/gemma-4-31B-it-GGUF \
  gemma-4-31B-it-Q8_0.gguf \
  --local-dir /tmp/models
# 다운로드 시간: 약 5분 (31GB)
```

## Phase 3: llama-server 실행

```bash
# 서버 시작 (GPU 전체 오프로드, 256K context)
nohup /tmp/llama.cpp/build/bin/llama-server \
  -m /tmp/models/gemma-4-31B-it-Q8_0.gguf \
  --host 0.0.0.0 \
  --port 8000 \
  -ngl 999 \
  -c 262144 \
  > /tmp/llama.log 2>&1 &
# VRAM 사용: ~57GB (96GB GPU 기준 여유 ~40GB)

# 로그 확인 ("server is listening" 메시지 확인)
tail -f /tmp/llama.log

# API 테스트
curl http://localhost:8000/v1/models
```

### 주요 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-ngl 999` | GPU에 올릴 레이어 수 (999=전체) | 0 (CPU) |
| `-c 8192` | Context length | 2048 |
| `--port 8000` | API 포트 | 8080 |
| `--host 0.0.0.0` | 외부 접근 허용 | 127.0.0.1 |

## Phase 4: SSH 터널 (로컬 PC에서)

Vast.ai는 직접 포트 접근이 안되므로 SSH 터널 사용:

```bash
# 로컬 PC 터미널에서 실행 (백그라운드)
ssh -o StrictHostKeyChecking=no -N -L 8000:localhost:8000 -p <PORT> root@<SSH_HOST> &

# 연결 확인
curl http://localhost:8000/v1/models
```

## Phase 5: Open WebUI 설치 (로컬 PC)

```bash
# Docker로 실행
docker run -d -p 3000:8080 \
  -e OPENAI_API_KEY=dummy \
  -e OPENAI_API_BASE_URL=http://host.docker.internal:8000/v1 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --add-host=host.docker.internal:host-gateway \
  ghcr.io/open-webui/open-webui:main

# 접속 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200이면 성공
```

### 첫 접속
1. 브라우저에서 `http://localhost:3000` 접속
2. 관리자 계정 생성 (첫 가입자가 관리자)
3. 모델 목록에서 `gemma-4-31B-it-Q8_0.gguf` 선택
4. 채팅 시작

### 연결이 안 될 경우
설정 → Admin → Connections → OpenAI API에서:
- **Base URL**: `http://host.docker.internal:8000/v1`
- **API Key**: `dummy`

## 종료 절차

```bash
# 1. Open WebUI 중지
docker stop open-webui

# 2. SSH 터널 종료
# 터널 PID 찾기
ps aux | grep "ssh -o StrictHostKeyChecking" | grep -v grep
kill <PID>

# 3. Vast.ai 인스턴스 삭제 (과금 방지!)
export VAST_API_KEY=<YOUR_VAST_API_KEY>
vastai destroy instance <INSTANCE_ID>

# 4. 삭제 확인 (빈 결과면 OK)
vastai show instances
```

## 재시작 절차

```bash
# 1. Vast.ai 인스턴스 생성 (Phase 1)
# 2. SSH 접속 → Phase 2~3 반복 (빌드+모델 다운로드+서버 시작)
# 3. SSH 터널 설정 (Phase 4)
# 4. Open WebUI 시작
docker start open-webui
```

## 비용 참고

| 항목 | 비용 |
|------|------|
| RTX PRO 6000 WS (96GB) | ~$1.26/hr |
| 1시간 사용 | ~$1.26 |
| 8시간 사용 | ~$10.08 |
| 모델 다운로드 | 무료 (HuggingFace) |
| Open WebUI | 무료 (오픈소스) |

## 트러블슈팅

### vLLM이 Gemma 4를 지원하지 않음
- vLLM 0.19.0 + transformers <5.0.0에서 `gemma4` 아키텍처 미인식
- 해결: llama.cpp 서버 사용

### cmake 빌드 실패 (cuBLAS not found)
```bash
apt-get install -y libcublas-dev-12-9  # CUDA 버전에 맞게
pip install cmake --upgrade            # cmake 3.22 → 4.x
```

### SSH 터널 끊김
```bash
# 자동 재연결 옵션
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
  -N -L 8000:localhost:8000 -p <PORT> root@<SSH_HOST> &
```

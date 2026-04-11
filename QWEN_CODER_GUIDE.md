# Vast.ai + vLLM + Qwen3-Coder-Next + Qwen Code 구성 가이드

## 개요

Vast.ai 원격 GPU에서 Qwen3-Coder-Next FP8 모델을 vLLM으로 서빙하고,
로컬 PC에서 Qwen Code CLI로 코딩 에이전트를 실행하는 구성.

```
[Vast.ai GPU 서버]                    [로컬 PC - Windows 11]
 vLLM server                           Qwen Code CLI (qwen)
 Qwen3-Coder-Next-FP8       ←SSH터널→  ~/.qwen/settings.json
 port 8000                             SSH tunnel → localhost:8000
```

## 실행 환경 (2026-04-10 기준)

| 항목 | 값 |
|------|-----|
| GPU | NVIDIA H100 NVL (96GB VRAM) |
| 모델 | Qwen/Qwen3-Coder-Next-FP8 (80B total, 3B active) |
| 양자화 | FP8 (공식) |
| 서빙 | vLLM 0.19.0 (공식 지원) |
| 비용 | ~$1.77/hr |
| 클라이언트 | Qwen Code v0.14.2 |

## 모델 스펙

| 항목 | 값 |
|------|-----|
| 전체 파라미터 | 80B |
| 활성 파라미터 | 3B (MoE, 512 expert 중 10 활성) |
| Context | 256K tokens |
| 아키텍처 | qwen3_next (Hybrid: Attention + GDN) |
| 라이선스 | Apache 2.0 |
| Tool Calling | 네이티브 지원 |
| Thinking Mode | 미지원 |

## 벤치마크

| 벤치마크 | Coder-Next | 참고 |
|----------|-----------|------|
| SWE-bench Verified | 70.6% | DeepSeek-V3.2(70.2%) 상회 |
| SWE-bench Pro | 44.3% | - |
| TerminalBench 2 | 36.2% | - |
| CWEval (보안) | 56.32% | 경쟁 모델 대비 최고 |

## Phase 1: Vast.ai 인스턴스 생성

```bash
export VAST_API_KEY=$VAST_API_KEY  # .env에서 로드

# GPU 검색 (80GB+ VRAM, 200GB+ 디스크, 성능순)
vastai search offers 'gpu_ram>=80 num_gpus=1 reliability>0.95 inet_down>200 dph<=2.00 disk_space>=150' -o 'dlperf-' --limit 10

# 인스턴스 생성 (vLLM Docker 이미지, 디스크 200GB 이상 필수)
vastai create instance <OFFER_ID> --image vllm/vllm-openai:latest --disk 200
```

## Phase 2: vLLM 서버 시작

```bash
# SSH 접속
ssh -o StrictHostKeyChecking=no -p <PORT> root@<SSH_HOST>

# vLLM 서버 시작
nohup vllm serve Qwen/Qwen3-Coder-Next-FP8 \
  --port 8000 \
  --host 0.0.0.0 \
  --max-model-len 32768 \
  --enable-prefix-caching \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  > /tmp/vllm.log 2>&1 &

# 로그 확인 ("Application startup complete" 확인)
tail -f /tmp/vllm.log

# API 테스트
curl http://localhost:8000/v1/models
```

### 주요 옵션

| 옵션 | 설명 |
|------|------|
| `--max-model-len 32768` | Context length |
| `--enable-prefix-caching` | 프리픽스 캐시 (재사용 효율) |
| `--enable-auto-tool-choice` | Function calling 활성화 |
| `--tool-call-parser qwen3_coder` | Qwen Coder 전용 파서 |

### 사용하면 안 되는 옵션

| 옵션 | 이유 |
|------|------|
| `--kv-cache-dtype fp8` | Hybrid 아키텍처와 KV cache 레이아웃 충돌 (AssertionError) |
| `--attention-backend FLASH_ATTN` | GDN 레이어와 충돌 (AssertionError) |

## Phase 3: SSH 터널 (로컬 PC)

```bash
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
  -N -L 8000:localhost:8000 -p <PORT> root@<SSH_HOST> &

# 연결 확인
curl http://localhost:8000/v1/models
```

## Phase 4: Qwen Code 설정

### 설치

```bash
npm install -g @qwen-code/qwen-code@latest
```

### 설정 (`~/.qwen/settings.json`)

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "Qwen/Qwen3-Coder-Next-FP8",
        "name": "Qwen3-Coder-Next (Vast.ai)",
        "baseUrl": "http://localhost:8000/v1",
        "description": "Qwen3-Coder-Next FP8 via vLLM on Vast.ai",
        "envKey": "VLLM_API_KEY"
      }
    ]
  },
  "env": {
    "VLLM_API_KEY": "dummy"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "Qwen/Qwen3-Coder-Next-FP8"
  }
}
```

### 실행

```bash
cd <project-directory>
qwen
```

## 종료

```bash
# 1. SSH 터널 종료
pkill -f "ssh.*-L.*8000:localhost:8000"

# 2. Vast.ai 인스턴스 삭제
export VAST_API_KEY=$VAST_API_KEY
vastai destroy instance <INSTANCE_ID>
vastai show instances  # 빈 결과 확인
```

## 클라이언트 호환성

| 클라이언트 | 상태 | 비고 |
|-----------|------|------|
| **Qwen Code** | ✅ 권장 | Qwen 공식 CLI, 모델 최적화 |
| OpenCode | ❌ 비안정 | tool calling 호환 문제 (반복 루프) |
| Open WebUI | ✅ 채팅 가능 | tool calling 불필요 |
| curl API | ✅ | 직접 API 호출 |

### OpenCode 호환 문제 상세

OpenCode + vLLM + Qwen3-Coder-Next는 알려진 호환성 문제:
- `hermes` 파서: tool call을 텍스트로만 출력
- `qwen3_xml` 파서: silent crash + 400 에러
- `qwen3_coder` 파서: 빈 응답 반복

관련 이슈:
- https://github.com/anomalyco/opencode/issues/1122
- https://github.com/anomalyco/opencode/issues/16488
- https://github.com/anomalyco/opencode/issues/4255

## 실제 실행 기록 (2026-04-10)

### 초기 시작 (첫 실행)

| 단계 | 소요 시간 | 비고 |
|------|----------|------|
| 인스턴스 생성 → running | ~3분 | H100 NVL, Virginia |
| 모델 다운로드 (80GB) | ~5분 | 51Gbps |
| 모델 로드 (GPU) | ~22초 | 74.9GB VRAM |
| torch.compile | ~49초 | CUDA 그래프 컴파일 |
| DeepGEMM 워밍업 | ~5분 | 3549 커널 (첫 실행 ~30분) |
| CUDA 그래프 캡처 | ~7초 | 48 그래프 |
| **총 준비 시간** | **~15분** | 캐시 후 재시작 기준 |

### 재시작 (캐시 있음)

| 단계 | 소요 시간 |
|------|----------|
| 모델 로드 | ~22초 |
| torch.compile | ~2초 (캐시) |
| DeepGEMM 워밍업 | ~1초 (캐시) |
| CUDA 그래프 | ~7초 |
| **총** | **~35초** |

### 트러블슈팅

- **디스크 부족**: 최소 200GB 디스크 필요 (80GB 모델 + 캐시)
- **GPU 메모리 미해제**: `killall python3`로 안 되면 `vastai reboot` 필요
- **DeepGEMM 워밍업 (첫 실행)**: ~30분 소요, 이후 캐시됨
- **MoE config 경고**: 동작에 문제없음

## Gemma 4 구성과 비교

| 항목 | Gemma 4 31B | Qwen3-Coder-Next |
|------|------------|------------------|
| 서빙 | llama.cpp (빌드 필요) | **vLLM (바로 실행)** |
| 설정 시간 | ~30분 | **~15분** (첫 실행) |
| 재시작 | ~5분 | **~35초** |
| Tool Calling | 미지원 | **네이티브 지원** |
| 코딩 벤치마크 | Codeforces 2150 | **SWE-bench 70.6%** |
| 비용/hr | $1.26 | $1.77 |
| 클라이언트 | Open WebUI, OpenCode | **Qwen Code** (권장) |

## 비용 실적

| 항목 | 값 |
|------|-----|
| GPU | H100 NVL (96GB), Virginia |
| 비용/hr | $1.77 |
| 실제 사용 시간 | 2.13시간 |
| **실제 비용** | **$3.76** |

## Context Length 이슈

Qwen Code는 대화가 길어지면 context를 빠르게 소비합니다:

| 설정 | 결과 |
|------|------|
| 32K | Phase 1 중 초과 |
| 64K | Phase 1 완료 후 초과 |
| 128K | Phase 2 중 초과 |
| **256K** | **전체 작업 가능** (VLLM_ALLOW_LONG_MAX_MODEL_LEN=1 필요) |

**권장 시작 명령**:
```bash
VLLM_ALLOW_LONG_MAX_MODEL_LEN=1 vllm serve Qwen/Qwen3-Coder-Next-FP8 \
  --host 0.0.0.0 --port 8000 \
  --max-model-len 262144 \
  --enable-prefix-caching \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --gpu-memory-utilization 0.95
```

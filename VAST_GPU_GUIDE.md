# Vast.ai GPU 임대 작업 가이드

## 환경 설정

```bash
# API 키 (.env에 저장됨)
export VAST_API_KEY=$VAST_API_KEY  # .env에서 로드

# CLI 설치
pip install vastai
```

## 1. GPU 검색

```bash
# 조건: VRAM 12GB+, 단일 GPU, $0.10/hr 이하, 신뢰도 95%+, 다운로드 200Mbps+
vastai search offers 'gpu_ram>=12 num_gpus=1 dph<=0.10 reliability>0.95 inet_down>200' -o 'dph' --limit 5
```

추천 GPU: RTX 3060 (12GB, $0.04~0.05/hr)

## 2. 인스턴스 생성

```bash
# ID는 검색 결과에서 선택
vastai create instance <OFFER_ID> \
  --image pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime \
  --disk 50 \
  --onstart-cmd "pip install faster-whisper librosa && echo READY"
```

## 3. 상태 확인

```bash
# 인스턴스 목록
vastai show instances

# 특정 인스턴스
vastai show instance <INSTANCE_ID>

# SSH URL
vastai ssh-url <INSTANCE_ID>
```

loading → running 전환까지 보통 15~60초.

## 4. SSH 접속 + 파일 업로드

```bash
# SSH 접속
ssh -o StrictHostKeyChecking=no -p <PORT> root@<HOST>

# 파일 업로드
scp -o StrictHostKeyChecking=no -P <PORT> <LOCAL_FILE> root@<HOST>:/tmp/

# 폴더 업로드
scp -o StrictHostKeyChecking=no -P <PORT> -r <LOCAL_DIR> root@<HOST>:/tmp/
```

## 5. 작업 실행 (Whisper)

```bash
# GPU 서버에서
ssh -p <PORT> root@<HOST> "python3 /tmp/poc/01_extract_features.py /tmp/audio/answer /tmp/poc/features"
```

## 6. 결과 다운로드

```bash
scp -o StrictHostKeyChecking=no -P <PORT> root@<HOST>:/tmp/poc/features/all_features.json ./poc/features/
```

## 7. 인스턴스 삭제

```bash
vastai destroy instance <INSTANCE_ID>

# 삭제 확인 (빈 결과면 OK)
vastai show instances
```

## 실제 작업 예시 (전체 흐름)

```bash
export VAST_API_KEY=$VAST_API_KEY  # .env에서 로드

# 1. 검색 + 생성
vastai search offers 'gpu_ram>=12 num_gpus=1 dph<=0.10 reliability>0.95' -o 'dph' --limit 3
vastai create instance <ID> --image pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime --disk 50

# 2. 대기
vastai ssh-url <INSTANCE_ID>  # ssh://root@sshX.vast.ai:PORT

# 3. 설치 + 업로드
ssh -p PORT root@sshX.vast.ai "pip install faster-whisper librosa"
scp -P PORT -r data/raw/sessions/session_001/audio/answer/ root@sshX.vast.ai:/tmp/audio/
scp -P PORT poc/01_extract_features.py root@sshX.vast.ai:/tmp/

# 4. 실행
ssh -p PORT root@sshX.vast.ai "python3 /tmp/01_extract_features.py /tmp/audio/answer /tmp/features"

# 5. 결과 회수
scp -P PORT root@sshX.vast.ai:/tmp/features/all_features.json ./poc/features/

# 6. 삭제
vastai destroy instance <INSTANCE_ID>
```

## 비용 참고

| 작업 | GPU | 소요 시간 | 비용 |
|------|-----|---------|------|
| 156개 오디오 특징 추출 | RTX 3060 | ~17분 | ~$0.01 |
| 25개 벤치마크 (8모델) | RTX 3060 | ~5분 | ~$0.005 |
| 모델 로드 (large-v3) | - | ~20초 | - |

## 주의사항

- loading이 3분 이상 걸리면 삭제 후 다른 인스턴스 선택
- 한글 파일명 SCP 전송 시 간혹 실패 → 재시도하면 해결
- 작업 완료 후 **반드시 `vastai destroy` 실행** (과금 방지)
- `vastai show instances`로 실행 중인 인스턴스 없는지 확인

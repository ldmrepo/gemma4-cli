# Gemma 4 31B Dense + Open WebUI 구성 TODO

## Phase 1: Vast.ai 서버 준비
- [x] Vast.ai CLI 설치 (v0.5.0 확인)
- [x] API 키 설정 확인 (`.env`)
- [x] GPU 검색 → RTX PRO 6000 WS (96GB VRAM, $1.26/hr)
- [x] 인스턴스 생성 (ID: 34349111)
- [x] vLLM 시도 → Gemma 4 미지원 (transformers 호환 문제)
- [x] llama.cpp 소스 빌드 (CUDA 지원)
- [x] GGUF 모델 다운로드 (unsloth/gemma-4-31B-it-Q8_0, 31GB)
- [x] llama-server 실행 및 API 테스트 (43.8 tok/s)
- [x] Context 256K (최대치) 설정 완료

## Phase 2: 로컬 Open WebUI 설치
- [x] Docker Desktop 확인 (v29.2.0)
- [x] Open WebUI 컨테이너 실행 (ENABLE_SIGNUP=true)
- [x] `http://localhost:3000` 접속 확인 (HTTP 200)

## Phase 3: 연결
- [x] SSH 터널 설정 (localhost:8000 → Vast.ai:8000)
- [x] Open WebUI → Docker env로 OpenAI API 연결 설정
- [x] 브라우저에서 Open WebUI 접속 → 모델 자동 선택됨
- [x] 테스트 대화 성공 (한국어 응답, 14초 thinking 후 답변)
- [x] OpenCode CLI 연결 성공 (v1.4.0)

## Phase 4: 프로젝트 문서화
- [x] 가이드 문서 작성 (VAST_GEMMA4_GUIDE.md)
- [x] 시작/종료/설정 스크립트 작성 (scripts/)
- [x] opencode.json 설정

## Phase 5: 정리
- [x] .gitignore 생성
- [x] API 키 하드코딩 제거 (VAST_GPU_GUIDE.md)
- [x] 임시 파일 정리 (.playwright-mcp/, *.png)
- [x] 작업 완료 후 인스턴스 삭제 (ID: 34349111)
- [x] 비용 확인 (총 $1.92 / 1.52시간)
- [x] Open WebUI 컨테이너 중지
- [x] GitHub 저장소 생성 및 푸시 (ldmrepo/gemma4-cli)

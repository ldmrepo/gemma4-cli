# 실시간 협업 코드 에디터 — 요구사항 명세

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 프로젝트명 | realtime-editor |
| 구조 | Monorepo (client/, server/) |
| 스택 | React + TypeScript, Express, Socket.io, Monaco Editor, SQLite |
| 포트 | 프론트 5173, 백엔드 3001 |

## Phase 1: 기본 코드 에디터

**목표**: 단일 유저 코드 편집 + 파일 관리

### 기능
- Monaco Editor 코드 편집기 (구문 강조, 자동완성)
- 언어 선택: JavaScript, TypeScript, Python, HTML, CSS
- 파일 CRUD (생성, 열기, 저장, 삭제)
- 파일 목록 사이드바
- 테마 전환 (dark/light)

### API
- GET    /api/files         — 파일 목록
- GET    /api/files/:id     — 파일 내용
- POST   /api/files         — 파일 생성 (name, language, content)
- PUT    /api/files/:id     — 파일 저장
- DELETE /api/files/:id     — 파일 삭제

### DB 스키마
- files (id, name, language, content, created_at, updated_at)

## Phase 2: 실시간 협업

**목표**: 멀티유저 실시간 편집

### 기능
- 방 생성 (UUID 기반, 공유 링크)
- 방 참가 (URL로 접속)
- 에디터 내용 실시간 동기화 (Socket.io)
- 접속자 목록 (닉네임, 색상)
- 다른 유저 커서 위치 표시 (색상 구분)
- 연결 끊김/재연결 처리

### Socket.io 이벤트
- join-room     — 방 참가
- leave-room    — 방 퇴장
- code-change   — 코드 변경 브로드캐스트
- cursor-move   — 커서 위치 브로드캐스트
- user-list     — 접속자 목록 업데이트

## Phase 3: 고급 기능

**목표**: 코드 실행 + 채팅

### 기능
- 코드 실행 버튼 (JavaScript만, sandboxed eval)
- 실행 결과 출력 패널 (console.log 캡처)
- 채팅 사이드바 (Socket.io)
- 실행 에러 표시

## UI 레이아웃

```
┌─────────────────────────────────────────────────┐
│ 헤더: 프로젝트명 | 방 ID | 접속자 | 테마 토글   │
├──────┬──────────────────────────┬───────────────┤
│ 파일 │                          │ 채팅          │
│ 목록 │    Monaco Editor         │ (Phase 3)     │
│      │                          │               │
│      │                          │               │
│      ├──────────────────────────┤               │
│      │ 출력 패널 (Phase 3)      │               │
└──────┴──────────────────────────┴───────────────┘
```

## 기술 요구사항

### 필수 패키지
- client: @monaco-editor/react, socket.io-client, react-router-dom
- server: express, socket.io, better-sqlite3, cors, uuid

### 보안
- 코드 실행은 Function constructor 사용 (eval 금지)
- console.log 오버라이드로 출력 캡처
- 실행 타임아웃 3초

### CORS
- origin: http://localhost:5173

## Qwen Code 프롬프트 순서

### Phase 1 (먼저 입력)
```
realtime-editor/ 프로젝트를 만들어.
server/: Express + better-sqlite3 + cors, 포트 3001
client/: React + TypeScript + @monaco-editor/react, 포트 5173

기능:
- Monaco Editor 코드 편집기 (JS/TS/Python/HTML/CSS 선택)
- 파일 CRUD API: GET/POST/PUT/DELETE /api/files
- DB: files (id, name, language, content, created_at, updated_at)
- 파일 목록 사이드바 + 에디터 메인 영역
- 다크/라이트 테마 전환

코드를 바로 작성해.
```

### Phase 2 (Phase 1 완료 후)
```
Socket.io로 실시간 협업을 추가해:
- 방 생성 (UUID), 공유 링크로 참가
- 코드 변경 실시간 동기화
- 접속자 목록 + 커서 위치 표시 (색상 구분)
- socket.io-client, socket.io, uuid 사용

기존 코드에 추가해.
```

### Phase 3 (Phase 2 완료 후)
```
고급 기능 추가:
- 코드 실행 버튼 (JavaScript, sandboxed Function constructor, 3초 타임아웃)
- 실행 결과 출력 패널 (console.log 캡처)
- 채팅 사이드바 (Socket.io 재활용)

기존 코드에 추가해.
```

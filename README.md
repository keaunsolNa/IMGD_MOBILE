# IMGD Mobile

React Native/Expo 기반 모바일 애플리케이션

## 🚀 시작하기

### 필수 요구사항
- Node.js
- Expo CLI
- Nginx (이미지 서빙용)

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **애플리케이션 시작**
```bash
npm start
```

**참고**: `npm start` 명령어는 자동으로 Nginx를 시작한 후 Expo 개발 서버를 실행합니다.

### Nginx 관리

- **Nginx 시작**: `npm run start:nginx`
- **Nginx 중지**: `npm run stop:nginx`
- **Nginx 재시작**: `npm run restart:nginx`
- **모든 프로세스 정리**: `npm run cleanup`

### 프로젝트 종료

개발을 마치고 프로젝트를 종료할 때는 다음 명령어를 사용하세요:

```bash
# 모든 프로세스 정리 (Nginx, Expo 등)
npm run cleanup
```

또는 `Ctrl+C`로 Expo를 종료한 후:

```bash
# Nginx만 종료
npm run stop:nginx
```

### 수동 Nginx 관리

Nginx가 `C:\nginx-1.26.3\nginx-1.26.3` 경로에 설치되어 있어야 합니다.

```bash
# Nginx 시작
cd C:\nginx-1.26.3\nginx-1.26.3
nginx

# Nginx 중지
nginx -s stop

# Nginx 재시작
nginx -s reload
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── screens/            # 화면 컴포넌트
│   ├── auth/           # 인증 관련 화면
│   ├── community/      # 커뮤니티 화면 (신규)
│   ├── file/           # 파일 관리 화면
│   ├── friend/         # 친구 관리 화면
│   ├── group/          # 그룹 관리 화면
│   ├── home/           # 메인 화면
│   └── myPage/         # 마이페이지
├── services/           # API 서비스
│   ├── api.ts          # 기본 API 설정
│   ├── auth.ts         # 인증 API
│   └── community.ts    # 커뮤니티 API (신규)
├── redux/              # Redux 상태 관리
├── navigation/         # 네비게이션 설정
├── styles/             # 스타일 파일
└── types/              # TypeScript 타입 정의
```

## 🔧 주요 기능

- Google SSO 로그인
- 그룹 관리
- 프로필 이미지 업로드
- 사용자 정보 관리
- Nginx를 통한 이미지 서빙
- **커뮤니티 기능** (신규)
  - 게시글 작성, 수정, 삭제
  - 태그 기반 게시글 필터링
  - 게시글 좋아요 및 조회수 기능
  - 댓글 시스템
  - 게시글 검색 기능

## 🆕 커뮤니티 기능 상세

### 게시글 관리
- **게시글 목록**: 최신순으로 게시글 목록 표시
- **게시글 작성**: 제목, 내용, 태그를 포함한 게시글 작성
- **게시글 수정/삭제**: 작성자 본인의 게시글만 수정/삭제 가능
- **게시글 상세**: 조회수 증가, 좋아요 기능, 댓글 시스템

### 태그 시스템
- **태그 필터링**: 특정 태그로 게시글 필터링
- **태그 관리**: 태그 생성, 수정, 삭제 (관리자 권한)
- **인기 태그**: 게시글 수가 많은 인기 태그 표시

### 댓글 시스템
- **댓글 작성**: 게시글에 댓글 작성
- **댓글 수정/삭제**: 본인 댓글만 수정/삭제 가능
- **댓글 목록**: 게시글별 댓글 목록 표시

### 검색 기능
- **게시글 검색**: 제목, 내용 기반 게시글 검색
- **태그 검색**: 특정 태그와 함께 검색 가능

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
├── services/           # API 서비스
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

# IMGD

## 프로젝트 소개

이 프로젝트는 사용자 관계 및 작업을 관리하는 시스템입니다. 백엔드는 Java로 작성되었으며, Spring MVC 및 Lombok 등과 같은 프레임워크를 사용하였습니다. 프론트엔드는 React Native/Expo 기반의 모바일 애플리케이션으로 구성되어 있습니다.

백엔드 프로젝트 패키지는 com.nks.imgd로 구성되어 있으며, 서비스, 컨트롤러, 파일 분석, 파일 업로드 및 사용자 관계 관리와 같은 여러 하위패키지로 세부 분류되어 있습니다.

## 🚀 시작하기

### 필수 요구사항

#### 백엔드 (Java)
- Java SDK 버전 22
- IntelliJ IDEA 2024.1.7
- Spring MVC
- MyBatis
- Lombok

#### 프론트엔드 (React Native)
- Node.js
- Expo CLI
- Nginx (이미지 서빙용)

### 설치 및 실행

#### 백엔드 서버
1. **Java 22 설치 확인**
2. **IntelliJ IDEA 2024.1.7로 프로젝트 열기**
3. **의존성 설치 및 Application.yml 설정**

#### 모바일 애플리케이션
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

### 백엔드 (Java)
```
com.nks.imgd/
├── ImgdApplication
├── ImgdApplicationTests
├── component/
│   ├── config/
│   ├── converter/
│   └── util/
│       ├── aop/
│       ├── commonMethod/
│       └── maker/
├── controller/
│   ├── article/
│   ├── file/
│   ├── group/
│   ├── oAuth/
│   ├── tag/
│   └── user/
├── dto/
│   ├── dataDTO/
│   ├── dictionary/
│   ├── Enum/
│   ├── Schema/
│   └── searchDTO/
├── mapper/
│   ├── article/
│   ├── file/
│   ├── group/
│   ├── tag/
│   └── user/
├── service/
│   ├── article/
│   ├── file/
│   ├── group/
│   ├── oAuth/
│   ├── tag/
│   └── user/
├── UserController.java
└── GroupController.java
```

### 프론트엔드 (React Native)
```
src/
├── components/          # 재사용 가능한 컴포넌트
├── screens/            # 화면 컴포넌트
│   ├── auth/           # 인증 관련 화면
│   ├── community/      # 커뮤니티 화면
│   ├── file/           # 파일 관리 화면
│   ├── friend/         # 친구 관리 화면
│   ├── group/          # 그룹 관리 화면
│   ├── home/           # 메인 화면
│   └── myPage/         # 마이페이지
├── services/           # API 서비스
│   ├── api.ts          # 기본 API 설정
│   ├── auth.ts         # 인증 API
│   └── community.ts    # 커뮤니티 API
├── redux/              # Redux 상태 관리
├── navigation/         # 네비게이션 설정
├── styles/             # 스타일 파일
└── types/              # TypeScript 타입 정의
```

## 🛠️ 주요 기술

### 백엔드
- **Java 22**: 최신 Java 버전 사용
- **Spring MVC**: 웹 애플리케이션 프레임워크
- **MyBatis**: 데이터베이스 매핑 프레임워크
- **Lombok**: 코드 간소화를 위한 라이브러리
- **JWT**: 보안을 위한 토큰 기반 인증
- **OAuth2**: Google SSO 로그인
- **sksamuel**: JSON 처리 라이브러리
- **Jakarta EE**: Jakarta imports 사용
- **Reflection**: 동적 프로그래밍 지원

### 프론트엔드
- **React Native**: 크로스 플랫폼 모바일 개발
- **Expo**: React Native 개발 도구
- **TypeScript**: 타입 안전성을 위한 언어
- **Redux**: 상태 관리 라이브러리
- **Nginx**: 이미지 서빙 서버

## 🔧 주요 기능

### 사용자 관리
- **로그인**: Google SSO 로그인 (OAuth2)
- **회원 정보**: 로그인한 유저의 회원 정보 검색
- **프로필 관리**: 사진 및 프로파일 변경
- **JWT 인증**: 보안을 위한 JWT 토큰 기반 인증

### 관계 관리
- **친구 관계**: 유저 간 친구 관계 관리
- **그룹 관리**: 그룹 생성 및 그룹으로 친구 초대
- **그룹 사용자**: 그룹 내 사용자 관리

### 파일 관리
- **이미지 업로드**: 그룹 내 사진 업로드 (webp 형식 지원)
- **파일 다운로드**: 공유 앨범 기능을 통한 파일 다운로드
- **Nginx 서빙**: Nginx를 통한 이미지 서빙

### 커뮤니티 기능
- **게시판**: 보드 게시판 기능
- **게시글 관리**: 게시글 작성, 수정, 삭제
- **태그 시스템**: 태그 기반 게시글 필터링
- **상호작용**: 게시글 좋아요 및 조회수 기능
- **댓글 시스템**: 게시글에 대한 댓글 작성 및 관리
- **검색 기능**: 게시글 검색 기능

## 📋 Application.yml 설정

백엔드 서버 실행을 위해 Application.yml 파일에 다음 사항들을 등록해야 합니다:

- 데이터베이스 연결 정보
- JWT 설정
- OAuth2 설정
- 파일 업로드 경로 설정
- 기타 서버 설정

자세한 설정 내용은 백엔드 프로젝트의 설정 파일을 참조하세요.

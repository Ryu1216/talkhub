# Community App MVP

React Native 기반의 간단한 커뮤니티 앱 MVP입니다.

## 기능

- 사용자 인증 (회원가입/로그인)
- 게시글 작성 및 조회
- 이미지 첨부 기능
- 댓글 시스템
- 실시간 데이터 동기화

## 기술 스택

- **React Native** with Expo
- **TypeScript**
- **Firebase** (Authentication, Firestore, Storage)
- **React Navigation** for navigation
- **NativeBase** for UI components
- **Zustand** for state management

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication, Firestore Database, Storage 활성화
3. `.env.example` 파일을 `.env`로 복사하고 Firebase 설정값 입력

```bash
cp .env.example .env
```

### 3. 앱 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 UI 컴포넌트
├── screens/        # 화면 컴포넌트
├── services/       # Firebase 및 외부 서비스 연동
├── stores/         # Zustand 상태 관리
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수
├── constants/      # 상수 정의
└── config/         # 설정 파일
```

## Firebase 보안 규칙

Firestore와 Storage에 적절한 보안 규칙을 설정해야 합니다. 자세한 내용은 설계 문서를 참조하세요.

## 개발 가이드

1. TypeScript를 사용하여 타입 안정성 확보
2. 컴포넌트는 재사용 가능하도록 설계
3. Firebase 서비스는 별도 모듈로 분리
4. 에러 처리는 일관된 방식으로 구현
5. 접근성 가이드라인 준수

## 라이센스

MIT License
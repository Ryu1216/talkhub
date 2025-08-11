# 🗣️ TalkHub - 커뮤니티 앱

React Native와 Firebase를 활용한 실시간 커뮤니티 플랫폼입니다.

## 📱 주요 기능

### 🔐 사용자 인증

- 이메일/비밀번호 기반 회원가입 및 로그인
- Firebase Authentication을 통한 안전한 사용자 관리
- 자동 로그인 유지 및 로그아웃 기능


### 📝 게시글 관리

- 게시글 작성, 조회, 수정, 삭제 (CRUD)
- 이미지 첨부 기능 (카메라 촬영 또는 갤러리 선택)
- 실시간 게시글 목록 업데이트
- 게시글 상세 보기

### 💬 댓글 시스템

- 실시간 댓글 작성 및 조회
- Firebase Firestore를 통한 실시간 동기화
- 댓글 수 자동 업데이트

### 🎨 사용자 인터페이스

- NativeBase를 활용한 모던하고 일관된 UI/UX
- 반응형 디자인으로 다양한 화면 크기 지원
- 직관적인 네비게이션 및 사용자 경험

## 🛠️ 기술 스택

### Frontend

- **React Native** - 크로스 플랫폼 모바일 앱 개발
- **Expo** - 빠른 개발 및 배포를 위한 플랫폼
- **TypeScript** - 타입 안전성 및 개발 생산성 향상
- **NativeBase** - UI 컴포넌트 라이브러리
- **React Navigation** - 화면 간 네비게이션

### Backend & Services

- **Firebase Authentication** - 사용자 인증 관리
- **Firebase Firestore** - NoSQL 실시간 데이터베이스
- **Firebase Storage** - 이미지 파일 저장소

### State Management

- **Zustand** - 가벼운 상태 관리 라이브러리

### Development Tools

- **Jest** - 단위 테스트 프레임워크
- **React Native Testing Library** - 컴포넌트 테스트
- **ESLint & Prettier** - 코드 품질 및 포맷팅

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn
- Expo CLI
- Firebase 프로젝트 설정

### 설치 및 실행

1. **저장소 클론**

   ```bash
   git clone https://github.com/your-username/talkhub.git
   cd talkhub
   ```

2. **의존성 설치**

   ```bash
   cd community-app
   npm install
   ```

3. **환경 변수 설정**

   ```bash
   # community-app/.env 파일 생성
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **앱 실행**

   ```bash
   # 웹에서 실행
   npm run web

   # iOS 시뮬레이터에서 실행
   npm run ios

   # Android 에뮬레이터에서 실행
   npm run android
   ```

## 📁 프로젝트 구조

```
community-app/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── auth/           # 인증 관련 컴포넌트
│   │   ├── common/         # 공통 컴포넌트
│   │   ├── comments/       # 댓글 관련 컴포넌트
│   │   └── posts/          # 게시글 관련 컴포넌트
│   ├── screens/            # 화면 컴포넌트
│   │   ├── auth/           # 인증 화면
│   │   └── main/           # 메인 화면들
│   ├── navigation/         # 네비게이션 설정
│   ├── services/           # Firebase 서비스
│   ├── stores/             # Zustand 상태 관리
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   └── constants/          # 상수 정의
├── assets/                 # 이미지, 폰트 등 정적 자원
└── __tests__/              # 테스트 파일
```

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

## 📱 지원 플랫폼

- **iOS** - iPhone 및 iPad
- **Android** - Android 스마트폰 및 태블릿
- **Web** - 모던 웹 브라우저

## 🔒 보안

- Firebase Security Rules를 통한 데이터 접근 제어
- 사용자 인증 기반 권한 관리
- 이미지 업로드 크기 제한 (5MB)
- 입력 데이터 유효성 검사

## 🎯 주요 특징

- **실시간 동기화**: Firestore를 통한 실시간 데이터 업데이트
- **오프라인 지원**: Firebase의 오프라인 캐싱 기능 활용
- **반응형 디자인**: 다양한 화면 크기에 최적화
- **타입 안전성**: TypeScript를 통한 런타임 오류 방지
- **모듈화된 구조**: 재사용 가능하고 유지보수하기 쉬운 컴포넌트 구조

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 언제든 연락주세요.

---

**TalkHub** - 소통이 시작되는 곳 🚀

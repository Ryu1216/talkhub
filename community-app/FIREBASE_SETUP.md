# Firebase 설정 문제 해결 가이드

## 문제 상황
Firebase Authentication API에서 404 오류가 발생하고 있습니다. 이는 Firebase 프로젝트에서 Authentication 서비스가 활성화되지 않았을 가능성이 높습니다.

## 해결 방법

### 1. Firebase Console에서 Authentication 활성화

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `talkhub-97f08` 프로젝트 선택
3. 왼쪽 메뉴에서 "Authentication" 클릭
4. "시작하기" 버튼 클릭 (처음 사용하는 경우)
5. "Sign-in method" 탭에서 "Email/Password" 활성화
6. "Users" 탭에서 사용자 관리 확인

### 2. Firebase 프로젝트 설정 확인

1. Firebase Console에서 프로젝트 설정 (톱니바퀴 아이콘) 클릭
2. "일반" 탭에서 프로젝트 ID가 `talkhub-97f08`인지 확인
3. "웹 앱" 섹션에서 API 키와 설정이 올바른지 확인

### 3. API 키 권한 확인

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. `talkhub-97f08` 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 메뉴
4. API 키 클릭하여 권한 확인
5. "Identity Toolkit API" 활성화 확인

## 임시 해결책

Firebase Console 설정이 어려운 경우, 다음 임시 해결책을 사용할 수 있습니다:

### 1. Firebase 에뮬레이터 사용
```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start --only auth
```

### 2. 로컬 인증 시스템 구현
AsyncStorage를 사용한 간단한 로컬 인증 시스템으로 대체

## 현재 오류 로그
```
Firebase Auth API Status: 404
The requested URL /v1/projects/talkhub-97f08:lookup was not found on this server.
```

이 오류는 Firebase Authentication 서비스가 활성화되지 않았음을 의미합니다.
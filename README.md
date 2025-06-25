# 선생님 스케줄 관리 앱

1:1 또는 1:2 레슨을 하는 선생님을 위한 스케줄 관리 웹앱입니다. 학생들의 패키지 관리, 수업 스케줄링, 알림 기능을 제공합니다.

## 주요 기능

### 📅 스케줄 관리
- **달력 기반 스케줄링**: 주간/월간 뷰로 스케줄 확인
- **드래그 앤 드롭**: 간편한 스케줄 조정
- **시간대 선택**: 원하는 시간대에 레슨 배정

### 👥 학생 관리
- **학생 정보 등록**: 이름, 연락처, 이메일
- **레슨 타입 설정**: 1:1 또는 1:2 레슨
- **수업 빈도 설정**: 매주 또는 격주

### 📦 패키지 관리
- **패키지 생성**: 4회, 8회, 12회 등 다양한 패키지
- **자동 계산**: 남은 수업 횟수 자동 추적
- **가격 관리**: 패키지별 가격 설정

### 🔔 알림 시스템
- **패키지 만료 알림**: 2회 이하 남은 패키지 알림
- **결제 알림**: 패키지 소진 시 결제 필요 알림
- **실시간 업데이트**: 5분마다 자동 새로고침

### 📊 대시보드
- **학생 목록**: 등록된 학생들의 정보와 패키지 현황
- **패키지 현황**: 활성 패키지와 남은 수업 횟수
- **알림 센터**: 중요한 알림들을 한눈에 확인

## 기술 스택

- **Frontend**: React 19, Vite
- **UI Library**: React Big Calendar, Lucide React
- **Styling**: CSS3 with modern design
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Date Handling**: date-fns

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd Scheduler-for-teacher
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 설정
`src/firebase.ts` 파일에서 Firebase 프로젝트 설정을 업데이트하세요:

```typescript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'SENDER_ID',
  appId: 'APP_ID',
};
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

## 사용법

### 학생 등록
1. 사이드바의 "학생 관리" 탭 클릭
2. "+ 학생 추가" 버튼 클릭
3. 학생 정보 입력 (이름, 연락처, 레슨 타입, 수업 빈도)
4. 저장

### 패키지 생성
1. 사이드바의 "패키지 관리" 탭 클릭
2. "+ 패키지 추가" 버튼 클릭
3. 학생 선택 및 패키지 정보 입력
4. 저장

### 스케줄 관리
1. 메인 달력에서 원하는 시간대 클릭
2. 레슨 정보 입력 (학생, 패키지, 시간 등)
3. 저장하여 스케줄에 추가

### 알림 확인
1. 우상단의 알림 벨 아이콘 클릭
2. 패키지 만료 및 결제 알림 확인
3. 필요한 조치 취하기

## 데이터 구조

### Student (학생)
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  frequency: 'weekly' | 'biweekly';
  lessonType: '1:1' | '1:2';
  createdAt: Date;
  updatedAt: Date;
}
```

### Package (패키지)
```typescript
{
  id: string;
  studentId: string;
  name: string;
  totalLessons: number;
  remainingLessons: number;
  price: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}
```

### Lesson (레슨)
```typescript
{
  id: string;
  studentId: string;
  packageId: string;
  title: string;
  start: Date;
  end: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 주요 특징

- **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능
- **실시간 업데이트**: Firebase를 통한 실시간 데이터 동기화
- **직관적인 UI**: 사용하기 쉬운 모던한 인터페이스
- **자동화된 알림**: 패키지 만료 및 결제 알림 자동화
- **유연한 스케줄링**: 다양한 수업 빈도와 패키지 지원

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의사항

프로젝트에 대한 문의사항이나 버그 리포트는 이슈를 통해 남겨주세요.

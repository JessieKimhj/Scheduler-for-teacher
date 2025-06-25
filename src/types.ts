// src/types.ts
export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  frequency: 'weekly' | 'biweekly'; // 매주/격주
  lessonType: '1:1' | '1:2'; // 1:1 또는 1:2 레슨
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: string;
  studentId: string;
  name: string; // 예: "4회 패키지", "8회 패키지"
  totalLessons: number;
  remainingLessons: number;
  price: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Lesson {
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

export interface ScheduleSettings {
  id: string;
  defaultLessonDuration: number; // 분 단위
  workingHours: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
  workingDays: number[]; // 0-6 (일요일-토요일)
} 
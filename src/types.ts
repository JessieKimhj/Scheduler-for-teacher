// src/types.ts
export interface Student {
  id: string;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'flexible';
  lessonType: 'vocal' | 'guitar' | 'guitar+vocal';
  totalLessons: number;
  remainingLessons: number;
  packagePrice?: number;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  studentId: string;
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
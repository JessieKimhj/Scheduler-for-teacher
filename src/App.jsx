import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ko from 'date-fns/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import LessonModal from './components/LessonModal';
import NotificationPanel from './components/NotificationPanel';

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function App() {
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);

  // 오늘 날짜의 8:00, 23:00을 min/max로 지정
  const today = new Date();
  const min = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0, 0);
  const max = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0, 0, 0);

  // 테스트용 이벤트 (오늘 10:00-11:00)
  const testEvent = {
    id: 'test-1',
    title: '테스트 레슨',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0, 0),
    studentId: 'test-student',
    status: 'scheduled'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 학생 데이터 로드
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);

      // 레슨 데이터 로드
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const lessonsData = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate()
      }));
      // 테스트 이벤트 추가
      const allEvents = [testEvent, ...lessonsData];
      console.log('Calendar events:', allEvents);
      console.log('min:', min);
      console.log('max:', max);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedSlot({ start, end });
    setShowLessonModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowLessonModal(true);
  };

  const handleSaveStudent = async () => {
    try {
      await loadData();
      setShowStudentModal(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error handling student save:', error);
      alert('학생 정보를 갱신하는 중 오류가 발생했습니다.');
    }
  };

  const handleSaveLesson = async () => {
    try {
      await loadData();
      setShowLessonModal(false);
      setSelectedSlot(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error handling lesson save:', error);
      alert('레슨 정보를 갱신하는 중 오류가 발생했습니다.');
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      try {
        // 1. 학생 삭제
        await deleteDoc(doc(db, 'students', studentId));

        // 2. 해당 학생의 모든 레슨 삭제
        const lessonsRef = collection(db, 'lessons');
        const q = query(lessonsRef, where('studentId', '==', studentId));
        const lessonsSnapshot = await getDocs(q);
        const deletePromises = lessonsSnapshot.docs.map(lessonDoc => deleteDoc(lessonDoc.ref));
        await Promise.all(deletePromises);

        // 3. 데이터 새로고침
        await loadData();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('학생 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 이벤트 스타일 설정
  const eventPropGetter = (event) => {
    return {
      style: {
        backgroundColor: '#b86adf',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px'
      }
    };
  };

  return (
    <div className="app">
      <Sidebar 
        students={students}
        onAddStudent={() => {
          setEditingStudent(null);
          setShowStudentModal(true);
        }}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
      />
      
      <div className="main-content">
        <div className="calendar-header">
          <h1>Scheduler</h1>
          <div className="view-controls">
            <button 
              className={view === 'week' ? 'active' : ''} 
              onClick={() => setView('week')}
            >
              주간
            </button>
            <button 
              className={view === 'month' ? 'active' : ''} 
              onClick={() => setView('month')}
            >
              월간
            </button>
          </div>
        </div>

        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            min={min}
            max={max}
            eventPropGetter={eventPropGetter}
            step={30}
            timeslots={2}
            messages={{
              next: ">",
              previous: "<",
              today: "오늘",
              month: "월",
              week: "주",
              day: "일",
              agenda: "일정",
              date: "날짜",
              time: "시간",
              event: "이벤트",
              noEventsInRange: "이 기간에 일정이 없습니다.",
            }}
          />
        </div>
      </div>

      <NotificationPanel />

      {showStudentModal && (
        <StudentModal 
          student={editingStudent}
          onClose={() => {
            setShowStudentModal(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {showLessonModal && (
        <LessonModal 
          slot={selectedSlot}
          event={selectedEvent}
          onClose={() => {
            setShowLessonModal(false);
            setSelectedSlot(null);
            setSelectedEvent(null);
          }}
          onSave={handleSaveLesson}
        />
      )}
    </div>
  );
}

export default App;

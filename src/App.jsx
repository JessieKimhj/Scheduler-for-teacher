import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ko from 'date-fns/locale/ko';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import LessonModal from './components/LessonModal';
import PackageModal from './components/PackageModal';
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
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  // 1년 범위 계산
  const minDate = startOfMonth(new Date());
  const maxDate = endOfMonth(addMonths(new Date(), 11)); // 1년 후 마지막 날

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

      // 패키지 데이터 로드
      const packagesSnapshot = await getDocs(collection(db, 'packages'));
      const packagesData = packagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPackages(packagesData);

      // 레슨 데이터 로드
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const lessonsData = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate()
      }));
      setEvents(lessonsData);
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

  const handleSaveStudent = async (studentData) => {
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), studentData);
      } else {
        await addDoc(collection(db, 'students'), studentData);
      }
      await loadData();
      setShowStudentModal(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error saving student:', error);
      alert('학생 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSavePackage = async (packageData) => {
    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), packageData);
      } else {
        await addDoc(collection(db, 'packages'), packageData);
      }
      await loadData();
      setShowPackageModal(false);
      setEditingPackage(null);
    } catch (error) {
      console.error('Error saving package:', error);
      alert('패키지 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (selectedEvent) {
        await updateDoc(doc(db, 'lessons', selectedEvent.id), lessonData);
      } else {
        await addDoc(collection(db, 'lessons'), lessonData);
      }
      await loadData();
      setShowLessonModal(false);
      setSelectedSlot(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('레슨 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentModal(true);
  };

  const handleEditPackage = (packageData) => {
    setEditingPackage(packageData);
    setShowPackageModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        await loadData();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('학생 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (window.confirm('정말로 이 패키지를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'packages', packageId));
        await loadData();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('패키지 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="app">
      <Sidebar 
        students={students}
        packages={packages}
        onAddStudent={() => {
          setEditingStudent(null);
          setShowStudentModal(true);
        }}
        onAddPackage={() => {
          setEditingPackage(null);
          setShowPackageModal(true);
        }}
        onEditStudent={handleEditStudent}
        onEditPackage={handleEditPackage}
        onDeleteStudent={handleDeleteStudent}
        onDeletePackage={handleDeletePackage}
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
            min={minDate}
            max={maxDate}
            messages={{
              next: "다음",
              previous: "이전",
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

      {showPackageModal && (
        <PackageModal 
          packageData={editingPackage}
          onClose={() => {
            setShowPackageModal(false);
            setEditingPackage(null);
          }}
          onSave={handleSavePackage}
        />
      )}
    </div>
  );
}

export default App;

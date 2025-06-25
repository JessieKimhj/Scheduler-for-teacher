import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { collection, getDocs, doc, addDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

const LessonModal = ({ slot, event, students, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    notes: ''
  });
  
  const timeOptions = [];
  for (let h = 9; h <= 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 22 && m > 0) continue;
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  const [startTime, setStartTime] = useState('09:00');
  const [lessonDuration, setLessonDuration] = useState(50);

  useEffect(() => {
    if (event) { // 수정 모드
      setFormData({
        studentId: event.studentId || '',
        title: event.title || '',
        notes: event.notes || ''
      });
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = (end.getTime() - start.getTime()) / 60000;
      setLessonDuration([30, 50, 80, 100].includes(duration) ? duration : 50);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    } else if (slot) { // 생성 모드
      const start = new Date(slot.start);
      const roundedMinutes = Math.floor(start.getMinutes() / 10) * 10;
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`);
      // Reset form data for new lesson
      setFormData({ studentId: '', title: '', notes: '' });
    }
  }, [event, slot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const baseDate = event ? new Date(event.start) : new Date(slot.start);
    const [hours, minutes] = startTime.split(':');
    const finalStart = new Date(baseDate);
    finalStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const finalEnd = new Date(finalStart.getTime() + lessonDuration * 60000);

    try {
      if (!event) {
        await runTransaction(db, async (transaction) => {
          const studentRef = doc(db, "students", formData.studentId);
          const studentDoc = await transaction.get(studentRef);

          if (!studentDoc.exists()) throw "Student document does not exist!";
          
          const currentRemaining = studentDoc.data().remainingLessons;
          if (currentRemaining <= 0) throw "No remaining lessons!";

          const newRemaining = currentRemaining - 1;
          transaction.update(studentRef, { remainingLessons: newRemaining });

          const lessonData = {
            ...formData,
            start: finalStart,
            end: finalEnd,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const newLessonRef = doc(collection(db, "lessons"));
          transaction.set(newLessonRef, lessonData);
        });
      } else {
        const lessonData = {
          ...formData,
          start: finalStart,
          end: finalEnd,
          updatedAt: new Date()
        };
        await updateDoc(doc(db, 'lessons', event.id), lessonData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving lesson:', error);
      if (error === "No remaining lessons!") {
        alert('남은 수업 횟수가 없습니다. 먼저 학생 정보에서 수업 패키지를 갱신해주세요.');
      } else {
        alert('레슨 정보 저장 중 오류가 발생했습니다.');
      }
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    
    setFormData(prev => ({
      ...prev,
      studentId,
      title: student ? `${student.name} 레슨` : ''
    }));
  };

  const selectedStudent = students.find(student => student.id === formData.studentId);
  
  let displayEndTime = '--:--';
  const baseDateForDisplay = event?.start || slot?.start;
  if (baseDateForDisplay) {
    const [hours, minutes] = startTime.split(':');
    const startForDisplay = new Date(baseDateForDisplay);
    startForDisplay.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const endForDisplay = new Date(startForDisplay.getTime() + lessonDuration * 60000);
    displayEndTime = `${String(endForDisplay.getHours()).padStart(2, '0')}:${String(endForDisplay.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{event ? '레슨 수정' : '새 레슨 추가'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="studentId">학생 *</label>
            <select
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleStudentChange}
              required
            >
              <option value="">학생을 선택하세요</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.remainingLessons || 0}회 남음)
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="student-info">
              <p><strong>레슨 타입:</strong> {selectedStudent.lessonType}</p>
              <p><strong>남은 수업:</strong> {selectedStudent.remainingLessons || 0}회</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">레슨 제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="레슨 제목을 입력하세요"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">시작 시간</label>
              <select
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              >
                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lessonDuration">수업 시간</label>
              <select
                id="lessonDuration"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(Number(e.target.value))}
                required
              >
                <option value={30}>30분</option>
                <option value={50}>50분</option>
                <option value={80}>80분</option>
                <option value={100}>100분</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>종료 시간 (자동 계산)</label>
            <input
              type="text"
              value={displayEndTime}
              readOnly
              className="readonly-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">메모</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="레슨 관련 참고사항"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="save-button" disabled={!formData.studentId}>
              {event ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal; 
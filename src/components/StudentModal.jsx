import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { addDoc, updateDoc, doc, collection, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const StudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly-1',
    lessonType: 'vocal',
    lessonDuration: 50,
    totalLessons: '',
    packagePrice: '',
    memo: ''
  });
  const [lessonTimes, setLessonTimes] = useState([{ day: '월', time: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        frequency: student.frequency || 'weekly-1',
        lessonType: student.lessonType || 'vocal',
        lessonDuration: student.lessonDuration || 50,
        totalLessons: student.totalLessons || '',
        packagePrice: student.packagePrice || '',
        memo: student.memo || ''
      });
      if (student.lessonTimes && student.lessonTimes.length > 0) {
        setLessonTimes(student.lessonTimes);
      } else {
        setLessonTimes([{ day: '월', time: '' }]);
      }
    }
  }, [student]);

  // 레슨 일정 자동 생성 함수
  const generateLessonEvents = (studentData, studentId) => {
    const events = [];
    const { lessonTimes, totalLessons, lessonDuration, frequency, name } = studentData;
    
    if (!lessonTimes || lessonTimes.length === 0) return events;
    
    // 주간 빈도에 따른 주차 간격 계산
    let weekInterval = 1;
    if (frequency === 'biweekly') {
      weekInterval = 2;
    } else if (frequency === 'flexible') {
      weekInterval = 1; // 유동적이지만 기본 1주
    }
    
    // 트라이얼/유동적은 기존대로 1회씩만 생성
    if (frequency === 'trial' || frequency === 'flexible') {
      lessonTimes.forEach((lessonTime) => {
        if (!lessonTime.time) return;
        const [hours, minutes] = lessonTime.time.split(':').map(Number);
        const dayOfWeek = weekDays.indexOf(lessonTime.day);
        const today = new Date();
        const startDate = new Date(today);
        const currentDay = today.getDay();
        let daysToAdd = dayOfWeek - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        startDate.setDate(today.getDate() + daysToAdd);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + lessonDuration);
        events.push({
          studentId: studentId,
          title: frequency === 'trial' ? name : `${name} 1`,
          start: startDate,
          end: endDate,
          status: 'scheduled',
          isTrial: frequency === 'trial',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      return events;
    }

    // 총 totalLessons만큼만 생성 (여러 lessonTimes가 있으면 순서대로 분배)
    let created = 0;
    let week = 0;
    while (created < totalLessons) {
      for (let i = 0; i < lessonTimes.length && created < totalLessons; i++) {
        const lessonTime = lessonTimes[i];
        if (!lessonTime.time) continue;
        const [hours, minutes] = lessonTime.time.split(':').map(Number);
        const dayOfWeek = weekDays.indexOf(lessonTime.day);
        const today = new Date();
        const startDate = new Date(today);
        const currentDay = today.getDay();
        let daysToAdd = dayOfWeek - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        startDate.setDate(today.getDate() + daysToAdd + week * weekInterval * 7);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + lessonDuration);
        events.push({
          studentId: studentId,
          title: `${name} ${created + 1}`,
          start: startDate,
          end: endDate,
          status: 'scheduled',
          isTrial: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
      }
      week++;
    }
    
    return events;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalLessonTimes = lessonTimes.filter(lt => lt.time.trim() !== '');
      const studentData = {
        ...formData,
        lessonTimes: finalLessonTimes,
        lessonDuration: parseInt(formData.lessonDuration, 10),
        totalLessons: parseInt(formData.totalLessons),
        remainingLessons: parseInt(formData.totalLessons),
        packagePrice: formData.packagePrice ? parseInt(formData.packagePrice) : 0,
        createdAt: student ? student.createdAt : new Date(),
        updatedAt: new Date()
      };
      
      // 배치 작업으로 학생과 레슨을 함께 저장
      const batch = writeBatch(db);
      
      if (student) {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, studentData);
        
        // 기존 레슨 삭제 후 새로 생성
        const existingLessonsQuery = await getDocs(collection(db, 'lessons'));
        existingLessonsQuery.docs.forEach(doc => {
          if (doc.data().studentId === student.id) {
            batch.delete(doc.ref);
          }
        });
        
        // 새 레슨 생성
        const newLessons = generateLessonEvents(studentData, student.id);
        console.log('Generated lessons for existing student:', newLessons);
        newLessons.forEach(lesson => {
          const lessonRef = doc(collection(db, 'lessons'));
          batch.set(lessonRef, lesson);
        });
      } else {
        const studentRef = doc(collection(db, 'students'));
        batch.set(studentRef, studentData);
        
        // 새 레슨 생성
        const newLessons = generateLessonEvents(studentData, studentRef.id);
        console.log('Generated lessons for new student:', newLessons);
        newLessons.forEach(lesson => {
          const lessonRef = doc(collection(db, 'lessons'));
          batch.set(lessonRef, lesson);
        });
      }
      
      await batch.commit();
      onSave(studentData);
    } catch (error) {
      console.error('Error saving student:', error);
      alert('학생 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'packagePrice') {
      if (value === '' || (/^\\d+$/.test(value) && Number(value) >= 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (index, field, value) => {
    const newTimes = [...lessonTimes];
    newTimes[index][field] = value;
    setLessonTimes(newTimes);
  };

  const addLessonTime = () => {
    setLessonTimes([...lessonTimes, { day: '월', time: '' }]);
  };

  const removeLessonTime = (index) => {
    const newTimes = lessonTimes.filter((_, i) => i !== index);
    setLessonTimes(newTimes);
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // Generate time options from 09:00 to 22:00 in 10-minute increments
  const getTimeOptions = () => {
    const options = [];
    let hour = 9;
    let minute = 0;
    while (hour < 22 || (hour === 22 && minute === 0)) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
      minute += 10;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return options;
  };
  const timeOptions = getTimeOptions();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{student ? '학생 정보 수정' : '새 학생 추가'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">이름 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="학생 이름을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lessonType">레슨 타입 *</label>
            <select
              id="lessonType"
              name="lessonType"
              value={formData.lessonType}
              onChange={handleChange}
              required
            >
              <option value="vocal">보컬</option>
              <option value="guitar">기타</option>
              <option value="guitar+vocal">기타 + 보컬</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="frequency">수업 빈도 *</label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              required
            >
              <option value="weekly-1">주 1회</option>
              <option value="weekly-2">주 2회</option>
              <option value="biweekly">격주</option>
              <option value="flexible">유동적</option>
              <option value="trial">트라이얼</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lessonTime">수업 시간</label>
            <select
              id="lessonDuration"
              name="lessonDuration"
              value={formData.lessonDuration}
              onChange={handleChange}
              required
              className="lesson-duration-select lesson-duration-block"
            >
              <option value="30">30분</option>
              <option value="50">50분</option>
              <option value="80">80분</option>
              <option value="100">100분</option>
            </select>
            {lessonTimes.map((item, index) => (
              <div key={index} className="lesson-time-row">
                <select
                  value={item.day}
                  onChange={(e) => handleTimeChange(index, 'day', e.target.value)}
                  className="lesson-time-day"
                >
                  {weekDays.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <select
                  value={item.time}
                  onChange={(e) => handleTimeChange(index, 'time', e.target.value)}
                  className="lesson-time-input"
                >
                  <option value="">시간 선택</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeLessonTime(index)} className="remove-time-button">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLessonTime} className="add-time-button">
              <Plus size={16} style={{ marginRight: '4px' }} />
              시간 추가
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="totalLessons">수업 패키지 *</label>
            <input
              type="number"
              id="totalLessons"
              name="totalLessons"
              value={formData.totalLessons}
              onChange={handleChange}
              min="1"
              required
              placeholder="예: 4, 8, 12"
            />
          </div>

          <div className="form-group">
            <label htmlFor="packagePrice">수강료</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
                fontWeight: 500,
                pointerEvents: 'none',
                fontSize: 15
              }}>$</span>
              <input
                type="number"
                id="packagePrice"
                name="packagePrice"
                value={formData.packagePrice || ''}
                onChange={handleChange}
                min="0"
                placeholder="예: 200000"
                style={{ paddingLeft: 24 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="memo">메모</label>
            <textarea
              id="memo"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              placeholder="특이사항, 참고사항 등"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isSubmitting}>
              취소
            </button>
            <button type="submit" className="save-button" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : (student ? '수정' : '추가')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal; 
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const StudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly-1',
    lessonType: 'vocal',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalLessonTimes = lessonTimes.filter(lt => lt.time.trim() !== '');
      const studentData = {
        ...formData,
        lessonTimes: finalLessonTimes,
        totalLessons: parseInt(formData.totalLessons),
        remainingLessons: parseInt(formData.totalLessons),
        packagePrice: formData.packagePrice ? parseInt(formData.packagePrice) : 0,
        createdAt: student ? student.createdAt : new Date(),
        updatedAt: new Date()
      };
      if (student) {
        await updateDoc(doc(db, 'students', student.id), studentData);
      } else {
        await addDoc(collection(db, 'students'), studentData);
      }
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

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

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
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lessonTime">수업 시간</label>
            {lessonTimes.map((item, index) => (
              <div key={index} className="lesson-time-row">
                <select
                  value={item.day}
                  onChange={(e) => handleTimeChange(index, 'day', e.target.value)}
                  className="lesson-time-day"
                >
                  {weekDays.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <input
                  type="time"
                  value={item.time}
                  onChange={(e) => handleTimeChange(index, 'time', e.target.value)}
                  className="lesson-time-input"
                />
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
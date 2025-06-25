import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const StudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly',
    lessonType: '1:1',
    totalLessons: '',
    packagePrice: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        frequency: student.frequency || 'weekly',
        lessonType: student.lessonType || '1:1',
        totalLessons: student.totalLessons || '',
        packagePrice: student.packagePrice || ''
      });
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const studentData = {
        ...formData,
        totalLessons: parseInt(formData.totalLessons),
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
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              <option value="weekly">매주</option>
              <option value="biweekly">격주</option>
            </select>
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
            <input
              type="number"
              id="packagePrice"
              name="packagePrice"
              value={formData.packagePrice || ''}
              onChange={handleChange}
              min="0"
              placeholder="예: 200000"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="save-button">
              {student ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal; 
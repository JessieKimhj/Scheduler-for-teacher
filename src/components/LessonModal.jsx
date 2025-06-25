import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addDoc, updateDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const LessonModal = ({ slot, event, onClose, onSave }) => {
  const [students, setStudents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    packageId: '',
    title: '',
    start: slot ? slot.start : new Date(),
    end: slot ? slot.end : new Date(),
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    loadStudents();
    if (event) {
      setFormData({
        studentId: event.studentId || '',
        packageId: event.packageId || '',
        title: event.title || '',
        start: event.start || new Date(),
        end: event.end || new Date(),
        status: event.status || 'scheduled',
        notes: event.notes || ''
      });
    } else if (slot) {
      setFormData(prev => ({
        ...prev,
        start: slot.start,
        end: slot.end
      }));
    }
  }, [event, slot]);

  const loadStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadPackages = async (studentId) => {
    if (!studentId) {
      setPackages([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'packages'),
        where('studentId', '==', studentId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const packagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const lessonData = {
        ...formData,
        start: new Date(formData.start),
        end: new Date(formData.end),
        createdAt: event ? event.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (event) {
        // 기존 레슨 업데이트
        await updateDoc(doc(db, 'lessons', event.id), lessonData);
      } else {
        // 새 레슨 추가
        await addDoc(collection(db, 'lessons'), lessonData);
      }

      onSave(lessonData);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('레슨 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'studentId') {
      loadPackages(value);
      // 학생이 변경되면 패키지도 초기화
      setFormData(prev => ({
        ...prev,
        packageId: ''
      }));
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    
    setFormData(prev => ({
      ...prev,
      studentId,
      title: student ? `${student.name} 레슨` : ''
    }));

    loadPackages(studentId);
  };

  const selectedPackage = packages.find(pkg => pkg.id === formData.packageId);
  const selectedStudent = students.find(student => student.id === formData.studentId);

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
                  {student.name} ({student.lessonType})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="student-info">
              <p><strong>레슨 타입:</strong> {selectedStudent.lessonType}</p>
              <p><strong>수업 빈도:</strong> {selectedStudent.frequency === 'weekly' ? '매주' : '격주'}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="packageId">패키지</label>
            <select
              id="packageId"
              name="packageId"
              value={formData.packageId}
              onChange={handleChange}
            >
              <option value="">패키지를 선택하세요</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.remainingLessons}회 남음)
                </option>
              ))}
            </select>
          </div>

          {selectedPackage && (
            <div className="package-info">
              <p><strong>남은 수업:</strong> {selectedPackage.remainingLessons}회</p>
              <p><strong>패키지 가격:</strong> {selectedPackage.price.toLocaleString()}원</p>
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
              <label htmlFor="start">시작 시간 *</label>
              <input
                type="datetime-local"
                id="start"
                name="start"
                value={format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm")}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end">종료 시간 *</label>
              <input
                type="datetime-local"
                id="end"
                name="end"
                value={format(new Date(formData.end), "yyyy-MM-dd'T'HH:mm")}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">상태</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
              <option value="no-show">불참</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">메모</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="레슨 관련 메모를 입력하세요"
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="save-button">
              {event ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal; 
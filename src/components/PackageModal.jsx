import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addDoc, updateDoc, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const PackageModal = ({ packageData, onClose, onSave }) => {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    totalLessons: 4,
    remainingLessons: 4,
    price: 0,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    loadStudents();
    if (packageData) {
      setFormData({
        studentId: packageData.studentId || '',
        name: packageData.name || '',
        totalLessons: packageData.totalLessons || 4,
        remainingLessons: packageData.remainingLessons || 4,
        price: packageData.price || 0,
        startDate: packageData.startDate ? new Date(packageData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isActive: packageData.isActive !== undefined ? packageData.isActive : true
      });
    }
  }, [packageData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const packageInfo = {
        ...formData,
        totalLessons: parseInt(formData.totalLessons),
        remainingLessons: parseInt(formData.remainingLessons),
        price: parseInt(formData.price),
        startDate: new Date(formData.startDate),
        createdAt: packageData ? packageData.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (packageData) {
        // 기존 패키지 업데이트
        await updateDoc(doc(db, 'packages', packageData.id), packageInfo);
      } else {
        // 새 패키지 추가
        await addDoc(collection(db, 'packages'), packageInfo);
      }

      onSave(packageInfo);
    } catch (error) {
      console.error('Error saving package:', error);
      alert('패키지 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePackageTypeChange = (e) => {
    const packageType = e.target.value;
    let totalLessons, name;
    
    switch (packageType) {
      case '4':
        totalLessons = 4;
        name = '4회 패키지';
        break;
      case '8':
        totalLessons = 8;
        name = '8회 패키지';
        break;
      case '12':
        totalLessons = 12;
        name = '12회 패키지';
        break;
      default:
        totalLessons = 4;
        name = '4회 패키지';
    }

    setFormData(prev => ({
      ...prev,
      totalLessons,
      remainingLessons: totalLessons,
      name
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{packageData ? '패키지 수정' : '새 패키지 추가'}</h2>
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
              onChange={handleChange}
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

          <div className="form-group">
            <label htmlFor="packageType">패키지 타입 *</label>
            <select
              id="packageType"
              onChange={handlePackageTypeChange}
              defaultValue="4"
            >
              <option value="4">4회 패키지</option>
              <option value="8">8회 패키지</option>
              <option value="12">12회 패키지</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">패키지명</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="패키지명을 입력하세요"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalLessons">총 수업 횟수</label>
              <input
                type="number"
                id="totalLessons"
                name="totalLessons"
                value={formData.totalLessons}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="remainingLessons">남은 수업 횟수</label>
              <input
                type="number"
                id="remainingLessons"
                name="remainingLessons"
                value={formData.remainingLessons}
                onChange={handleChange}
                min="0"
                max={formData.totalLessons}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="price">가격 (원)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              placeholder="패키지 가격을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">시작일 *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              활성 패키지
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="save-button">
              {packageData ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageModal; 
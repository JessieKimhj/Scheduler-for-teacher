import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { collection, getDocs, doc, addDoc, updateDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
// 요일 인덱스 매핑
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * baseDate 이후에 가능한 수업 요일 중 가장 가까운 날짜를 반환
 *
 * @param {Date} baseDate - 기준 날짜
 * @param {Array} lessonTimes - 수업 시간 배열 (예: [{ day: '월', time: '16:00' }, ...])
 * @param {string} frequency - 예: 'weekly-1', 'weekly-2'
 * @returns {Date} - 다음 수업 날짜
 */
function getNextLessonDate(baseDate, lessonTimes, frequency) {
  const weekInterval = parseInt(frequency.split('-')[1] || '1', 10);
  const candidates = [];

  lessonTimes.forEach(lt => {
    if (!lt.day || !lt.time) return;

    const [hour, minute] = lt.time.split(':').map(Number);
    const dayIndex = weekDays.indexOf(lt.day);
    if (dayIndex === -1) return;

    const candidate = new Date(baseDate);
    candidate.setHours(hour, minute, 0, 0);

    const baseDay = baseDate.getDay(); // 기준 날짜의 요일
    const baseTime = baseDate.getHours() * 60 + baseDate.getMinutes();
    const candidateTime = hour * 60 + minute;

    let daysToAdd = dayIndex - baseDay;

    if (daysToAdd < 0 || (daysToAdd === 0 && candidateTime <= baseTime)) {
      // 이미 지났거나 같은 요일이지만 시간이 지났으면 다음 주로
      daysToAdd += 7 * weekInterval;
    }

    candidate.setDate(baseDate.getDate() + daysToAdd);
    candidates.push(candidate);
  });

  if (candidates.length === 0) {
    return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  candidates.sort((a, b) => a - b);
  return candidates[0];
}





async function handleLessonCancel(event, db) {
  try {
    console.log('handleLessonCancel 시작:', event);
    const cancelledStart = event.start instanceof Date ? event.start : event.start.toDate();
    const studentId = event.studentId;
    const cancelledPackageNumber = event.packageNumber || 1;

    console.log('취소 정보:', { studentId, cancelledPackageNumber });

    // 학생 정보 가져오기
    const studentSnapshot = await getDocs(collection(db, 'students'));
    const student = studentSnapshot.docs.find(doc => doc.id === studentId)?.data();
    console.log('학생 정보:', student);
    
    if (!student) {
      console.error('학생 정보를 찾을 수 없습니다.');
      return;
    }
    
    const {
      numberOfPackage = 4,
      lessonTimes = [],
      lessonDuration = 50,
      name = '',
      frequency = 'weekly-1',
    } = student;

    // 1. 모든 레슨 가져오기
    const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
    const allLessons = lessonsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(l => l.studentId === studentId)
      .sort((a, b) => {
        const aStart = a.start instanceof Date ? a.start : a.start.toDate();
        const bStart = b.start instanceof Date ? b.start : b.start.toDate();
        return aStart - bStart;
      });
    
    // 2. 취소된 레슨 삭제
    console.log('레슨 삭제 시작:', event.id);
    await deleteDoc(doc(db, 'lessons', event.id));
    console.log('레슨 삭제 완료');
    
    // 3. 해당 패키지의 레슨들 필터링 (취소된 레슨 제외)
    let packageLessons = allLessons
      .filter(l => l.packageNumber === cancelledPackageNumber && l.id !== event.id)
      .sort((a, b) => {
        const aStart = a.start instanceof Date ? a.start : a.start.toDate();
        const bStart = b.start instanceof Date ? b.start : b.start.toDate();
        return aStart - bStart;
      });
    
    console.log('패키지 레슨들:', packageLessons.length, '개');
    console.log('필요한 레슨 수:', numberOfPackage);

    // 4. 취소된 레슨 날짜를 기준으로 설정
    let baseDate = new Date(cancelledStart);
    console.log('취소된 레슨 날짜:', baseDate);
    console.log('취소된 레슨 날짜 (7월 21일이어야 함):', baseDate.getMonth() + 1, '월', baseDate.getDate(), '일');

    // 5. 부족한 레슨 생성
    console.log('레슨 생성 시작. 현재:', packageLessons.length, '필요:', numberOfPackage);
    
    // 새로 생성할 레슨들을 별도 배열로 관리
    const newLessons = [];
    while (packageLessons.length + newLessons.length < numberOfPackage) {
      console.log('새 레슨 생성 중...', packageLessons.length + newLessons.length + 1, '번째');
      const nextDate = getNextLessonDate(baseDate, lessonTimes, frequency);
      console.log('다음 레슨 날짜:', nextDate);
      
      const newStart = new Date(nextDate);
      const newEnd = new Date(newStart);
      newEnd.setMinutes(newEnd.getMinutes() + lessonDuration);

      const newLesson = {
        studentId: studentId,
        title: `${name} ${packageLessons.length + newLessons.length + 1}`,
        start: newStart,
        end: newEnd,
        status: 'scheduled',
        isTrial: false,
        isSecondPackage: cancelledPackageNumber > 1,
        isPaid: false,
        packageNumber: cancelledPackageNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      newLessons.push(newLesson);
      baseDate = newStart; // 다음 레슨 계산을 위한 기준 날짜 업데이트
    }
    
    // 기존 레슨과 새 레슨 합치기
    packageLessons = [...packageLessons, ...newLessons];
    console.log('레슨 생성 완료. 총:', packageLessons.length, '개 (기존:', packageLessons.length - newLessons.length, ', 새로생성:', newLessons.length, ')');

    // 6. 회차 번호 재정렬
    packageLessons.forEach((lesson, index) => {
      const oldTitle = lesson.title;
      const newTitle = lesson.title.replace(/\d+$/, (index + 1).toString());
      lesson.title = newTitle;
      console.log(`회차 ${index + 1}: ${oldTitle} -> ${newTitle}`);
    });
    console.log('회차 번호 재정렬 완료');

    // 7. DB 업데이트
    const batchUpdates = [];
    for (const lesson of packageLessons) {
      if (lesson.id) {
        // 기존 레슨 업데이트
        batchUpdates.push(
          updateDoc(doc(db, 'lessons', lesson.id), {
            title: lesson.title,
            start: lesson.start,
            end: lesson.end,
            updatedAt: new Date(),
          })
        );
      } else {
        // 새 레슨 추가
        batchUpdates.push(addDoc(collection(db, 'lessons'), lesson));
      }
    }
    console.log('DB 업데이트 시작. 배치 작업 수:', batchUpdates.length);
    if (batchUpdates.length > 0) {
      await Promise.all(batchUpdates);
    }
    console.log('DB 업데이트 완료');
  } catch (error) {
    console.error('handleLessonCancel 에러:', error);
    alert('취소 처리 중 오류가 발생했습니다: ' + error.message);
    throw error;
  }
}

const LessonModal = ({ slot, event, students = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    notes: '',
    status: 'scheduled',
    isPaid: false
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
  const [selectedDay, setSelectedDay] = useState(0);
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  useEffect(() => {
    if (event) { // 수정 모드
      setFormData({
        studentId: event.studentId || '',
        title: event.title || '',
        notes: event.notes || '',
        status: event.status || 'scheduled',
        isPaid: event.isPaid || false
      });
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = (end.getTime() - start.getTime()) / 60000;
      setLessonDuration([30, 50, 80, 100].includes(duration) ? duration : 50);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setSelectedDay(start.getDay());
    } else if (slot) { // 생성 모드
      const start = new Date(slot.start);
      const roundedMinutes = Math.floor(start.getMinutes() / 10) * 10;
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`);
      setSelectedDay(start.getDay());
      // Reset form data for new lesson
      setFormData({ studentId: '', title: '', notes: '', status: 'scheduled', isPaid: false });
    }
  }, [event, slot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const baseDate = event ? new Date(event.start) : new Date(slot.start);
    const [hours, minutes] = startTime.split(':');
    const finalStart = new Date(baseDate);
    
    // 요일 변경 시 날짜 조정
    const dayDiff = selectedDay - finalStart.getDay();
    finalStart.setDate(finalStart.getDate() + dayDiff);
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
        // 취소 선택 시 레슨 취소 처리
        if (formData.status === 'cancelled' || formData.status === 'same-day-cancel') {
          console.log('취소 처리 시작:', event);
          await handleLessonCancel(event, db);
          console.log('취소 처리 완료');
        } else {
          const lessonData = {
            ...formData,
            start: finalStart,
            end: finalEnd,
            updatedAt: new Date()
          };
          await updateDoc(doc(db, 'lessons', event.id), lessonData);
        }
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
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
  };

  const selectedStudent = (students || []).find(student => student.id === formData.studentId);
  
  let displayEndTime = '--:--';
  const baseDateForDisplay = event?.start || slot?.start;
  if (baseDateForDisplay) {
    const [hours, minutes] = startTime.split(':');
    const startForDisplay = new Date(baseDateForDisplay);
    const dayDiff = selectedDay - startForDisplay.getDay();
    startForDisplay.setDate(startForDisplay.getDate() + dayDiff);
    startForDisplay.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const endForDisplay = new Date(startForDisplay.getTime() + lessonDuration * 60000);
    displayEndTime = `${String(endForDisplay.getHours()).padStart(2, '0')}:${String(endForDisplay.getMinutes()).padStart(2, '0')}`;
  }

  // 1. 결제 완료 버튼 노출 조건
  const isFirstPendingOfSecondPackage = event && event.isSecondPackage && !event.isPaid && event.title.match(/\d+$/)?.[0] === '1';

  // 2. 결제 완료 처리 함수
  const handleConfirmPayment = async () => {
    if (!event) return;
    
    try {
      // 학생 정보 및 레슨 데이터 가져오기
      const [studentSnapshot, lessonsSnapshot] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'lessons'))
      ]);
      
      const student = studentSnapshot.docs.find(doc => doc.id === event.studentId)?.data();
      if (!student) {
        alert('학생 정보를 찾을 수 없습니다.');
        return;
      }
      
      const { numberOfPackage = 4, totalLessons = 8, lessonTimes = [], lessonDuration = 50, name = '', frequency = 'weekly-1' } = student;
      
      // 해당 학생의 모든 반투명 레슨 가져오기
      const allLessons = lessonsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.studentId === event.studentId && l.isSecondPackage && !l.isPaid)
        .sort((a, b) => {
          const aStart = a.start instanceof Date ? a.start : a.start.toDate();
          const bStart = b.start instanceof Date ? b.start : b.start.toDate();
          return aStart - bStart;
        });
      
      // 클릭한 레슨 찾기
      const clickedStart = event.start instanceof Date ? event.start : event.start.toDate();
      const clickedIdx = allLessons.findIndex(l => {
        const lessonStart = l.start instanceof Date ? l.start : l.start.toDate();
        return Math.abs(clickedStart.getTime() - lessonStart.getTime()) < 1000;
      });
      
      if (clickedIdx === -1) {
        alert('해당 레슨을 찾을 수 없습니다.');
        return;
      }
      
      // 패키지 시작 인덱스 계산
      const packageStartIdx = Math.floor(clickedIdx / numberOfPackage) * numberOfPackage;
      const thisPackage = allLessons.slice(packageStartIdx, packageStartIdx + numberOfPackage);
      
      if (thisPackage.length < numberOfPackage) {
        alert(`패키지 레슨이 부족합니다. (필요: ${numberOfPackage}, 실제: ${thisPackage.length})`);
        return;
      }
      
      // 배치 작업
      const batch = [];
      
      // 1) 현재 패키지 불투명화
      thisPackage.forEach(lesson => {
        batch.push(updateDoc(doc(db, 'lessons', lesson.id), { 
          isPaid: true, 
          isSecondPackage: false 
        }));
      });
      
      // 2) 다음 패키지 생성
      const lastLesson = thisPackage[thisPackage.length - 1];
      const lastStartDate = lastLesson.start instanceof Date ? lastLesson.start : lastLesson.start.toDate();
      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekInterval = frequency === 'biweekly' ? 2 : 1;

      let created = 0, week = 0;
      while (created < numberOfPackage) {
        for (let i = 0; i < lessonTimes.length && created < numberOfPackage; i++) {
          const lessonTime = lessonTimes[i];
          if (!lessonTime.time) continue;
          
          const [hours, minutes] = lessonTime.time.split(':').map(Number);
          const dayOfWeek = weekDays.indexOf(lessonTime.day);
          
          const startDate = new Date(lastStartDate);
          startDate.setDate(startDate.getDate() + (week + 1) * weekInterval * 7);
          startDate.setDate(startDate.getDate() - startDate.getDay() + dayOfWeek);
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setMinutes(startDate.getMinutes() + lessonDuration);
          
          // 다음 패키지 번호 계산 (기존 최대 packageNumber + 1)
          const nextPackageNumber = Math.max(...allLessons.map(l => l.packageNumber || 1)) + 1;
          
          const newLesson = {
            studentId: event.studentId,
            title: `${name} ${created + 1}`,
            start: startDate,
            end: endDate,
            status: 'scheduled',
            isTrial: false,
            isSecondPackage: true,
            isPaid: false,
            packageNumber: nextPackageNumber,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          batch.push(addDoc(collection(db, 'lessons'), newLesson));
          created++;
        }
        week++;
      }
      
      await Promise.all(batch);
      onSave();
    } catch (error) {
      console.error('결제 완료 오류:', error);
      alert('결제 완료 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{event ? '취소/변경' : '새 레슨 추가'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!event && (
            <>
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
                  {Array.isArray(students) && students.map(student => (
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
            </>
          )}

          {event && (
            <>
              <div className="form-group">
                <label htmlFor="status">취소</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="scheduled">--</option>
                  <option value="cancelled">취소</option>
                  <option value="same-day-cancel">당일캔슬</option>
                </select>
              </div>
              
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>변경</h3>
            </>
          )}



          <div className="form-row">
            <div className="form-group">
              <label htmlFor="selectedDay">요일</label>
              <select
                id="selectedDay"
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                required
              >
                {weekDays.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
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
            {isFirstPendingOfSecondPackage && (
              <button type="button" className="save-button" onClick={handleConfirmPayment}>
                결제 완료
              </button>
            )}
            <button type="submit" className="save-button" disabled={!event && !formData.studentId}>
              {event ? '확인' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal; 
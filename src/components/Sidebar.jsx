import React, { useState } from 'react';
import { Users, Bell, Edit, Trash2 } from 'lucide-react';

const Sidebar = ({ 
  students, 
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent, 
}) => {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Scheduler</h2>
      </div>

      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={20} />
          학생 관리
        </button>
        <button 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={20} />
          알림
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'students' && (
          <div className="students-section">
            <div className="section-header">
              <h3>학생 목록</h3>
              <button className="add-button" onClick={onAddStudent}>
                + 학생 추가
              </button>
            </div>
            <div className="students-list">
              {students.map(student => (
                <div key={student.id} className="student-item">
                  <div className="student-info">
                    <h4>{student.name}</h4>
                    <p>{student.lessonType} • {student.frequency === 'weekly' ? '매주' : '격주'}</p>
                    <div className="lesson-times-display">
                      {student.lessonTimes && student.lessonTimes.map((lt, index) => (
                        <span key={index} className="time-tag">{lt.day} {lt.time}</span>
                      ))}
                    </div>
                  </div>
                  <div className="student-packages">
                    <div className="package-badge">
                      {student.remainingLessons || 0}회 남음
                    </div>
                  </div>
                  <div className="student-actions">
                    <button 
                      className="action-button edit"
                      onClick={() => onEditStudent(student)}
                      title="편집"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => onDeleteStudent(student.id)}
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="empty-state">
                  <p>등록된 학생이 없습니다.</p>
                  <button className="add-button" onClick={onAddStudent}>
                    첫 번째 학생 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-section">
            <h3>알림</h3>
            <div className="empty-state">
              <p>새로운 알림이 없습니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 
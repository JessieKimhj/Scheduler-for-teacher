import React, { useState } from 'react';
import { Users, Package, Bell, Edit, Trash2 } from 'lucide-react';

const Sidebar = ({ 
  students, 
  packages, 
  onAddStudent, 
  onAddPackage, 
  onEditStudent, 
  onEditPackage, 
  onDeleteStudent, 
  onDeletePackage 
}) => {
  const [activeTab, setActiveTab] = useState('students');

  const getExpiringPackages = () => {
    return packages.filter(pkg => {
      const remainingLessons = pkg.remainingLessons;
      const isExpiring = remainingLessons <= 2; // 2회 이하 남은 패키지
      return isExpiring && pkg.isActive;
    });
  };

  const expiringPackages = getExpiringPackages();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>스케줄 관리</h2>
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
          className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <Package size={20} />
          패키지 관리
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
                  </div>
                  <div className="student-packages">
                    {packages
                      .filter(pkg => pkg.studentId === student.id && pkg.isActive)
                      .map(pkg => (
                        <div key={pkg.id} className="package-badge">
                          {pkg.remainingLessons}회 남음
                        </div>
                      ))}
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

        {activeTab === 'packages' && (
          <div className="packages-section">
            <div className="section-header">
              <h3>패키지 관리</h3>
              <button className="add-button" onClick={onAddPackage}>
                + 패키지 추가
              </button>
            </div>
            <div className="packages-list">
              {packages.filter(pkg => pkg.isActive).map(pkg => {
                const student = students.find(s => s.id === pkg.studentId);
                return (
                  <div key={pkg.id} className="package-item">
                    <div className="package-info">
                      <h4>{student?.name || '알 수 없음'}</h4>
                      <p>{pkg.name}</p>
                    </div>
                    <div className="package-status">
                      <span className={`status ${pkg.remainingLessons <= 2 ? 'warning' : 'normal'}`}>
                        {pkg.remainingLessons}회 남음
                      </span>
                    </div>
                    <div className="package-actions">
                      <button 
                        className="action-button edit"
                        onClick={() => onEditPackage(pkg)}
                        title="편집"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => onDeletePackage(pkg.id)}
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {packages.filter(pkg => pkg.isActive).length === 0 && (
                <div className="empty-state">
                  <p>등록된 패키지가 없습니다.</p>
                  <button className="add-button" onClick={onAddPackage}>
                    첫 번째 패키지 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-section">
            <h3>알림</h3>
            {expiringPackages.length > 0 ? (
              <div className="notifications-list">
                {expiringPackages.map(pkg => {
                  const student = students.find(s => s.id === pkg.studentId);
                  return (
                    <div key={pkg.id} className="notification-item warning">
                      <Bell size={16} />
                      <div className="notification-content">
                        <p><strong>{student?.name}</strong>님의 패키지가 곧 만료됩니다</p>
                        <small>{pkg.remainingLessons}회 남음</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>새로운 알림이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 
import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, DollarSign } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // 5분마다 알림 새로고침
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // 패키지 정보 로드
      const packagesQuery = query(
        collection(db, 'packages'),
        where('isActive', '==', true)
      );
      const packagesSnapshot = await getDocs(packagesQuery);
      const packages = packagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 학생 정보 로드
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 알림 생성
      const newNotifications = [];

      // 패키지 만료 알림 (2회 이하 남은 경우)
      packages.forEach(pkg => {
        if (pkg.remainingLessons <= 2) {
          const student = students.find(s => s.id === pkg.studentId);
          if (student) {
            newNotifications.push({
              id: `package-${pkg.id}`,
              type: 'package-expiring',
              title: '패키지 만료 예정',
              message: `${student.name}님의 ${pkg.name}이 곧 만료됩니다. (${pkg.remainingLessons}회 남음)`,
              student: student,
              package: pkg,
              timestamp: new Date(),
              isRead: false
            });
          }
        }
      });

      // 패키지 완전 소진 알림 (0회 남은 경우)
      packages.forEach(pkg => {
        if (pkg.remainingLessons === 0) {
          const student = students.find(s => s.id === pkg.studentId);
          if (student) {
            newNotifications.push({
              id: `package-empty-${pkg.id}`,
              type: 'package-empty',
              title: '패키지 소진',
              message: `${student.name}님의 ${pkg.name}이 모두 소진되었습니다. 결제가 필요합니다.`,
              student: student,
              package: pkg,
              timestamp: new Date(),
              isRead: false
            });
          }
        }
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'package-expiring':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'package-empty':
        return <DollarSign size={16} className="text-red-500" />;
      default:
        return <Bell size={16} />;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'package-expiring':
        return 'notification-warning';
      case 'package-empty':
        return 'notification-error';
      default:
        return 'notification-info';
    }
  };

  return (
    <div className="notification-panel">
      <button 
        className="notification-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            <button 
              className="close-notifications"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${getNotificationClass(notification.type)} ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <small>
                      {notification.timestamp.toLocaleString('ko-KR')}
                    </small>
                  </div>
                  {!notification.isRead && (
                    <div className="unread-indicator" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="mark-all-read"
                onClick={() => {
                  setNotifications(prev => 
                    prev.map(n => ({ ...n, isRead: true }))
                  );
                  setUnreadCount(0);
                }}
              >
                모두 읽음으로 표시
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel; 
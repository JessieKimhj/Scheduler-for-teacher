import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, DollarSign } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadAndSetNotifications = async () => {
      if (isOpen) {
        await loadNotifications();
      }
    };
    loadAndSetNotifications();
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'students'),
        where('remainingLessons', '<=', 2)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      const newNotifications = [];
      studentsSnapshot.forEach(doc => {
        const student = { id: doc.id, ...doc.data() };
        
        if (student.remainingLessons > 0) {
          // 1회 또는 2회 남은 경우
          newNotifications.push({
            id: `student-expiring-${student.id}`,
            type: 'package-expiring',
            title: '수업권 만료 예정',
            message: `${student.name}님의 남은 수업이 ${student.remainingLessons}회 입니다.`,
            student: student,
            timestamp: new Date(),
            isRead: false,
          });
        } else {
          // 0회 남은 경우
          newNotifications.push({
            id: `student-empty-${student.id}`,
            type: 'package-empty',
            title: '수업권 소진',
            message: `${student.name}님의 수업권이 모두 소진되었습니다. 갱신이 필요합니다.`,
            student: student,
            timestamp: new Date(),
            isRead: false,
          });
        }
      });
      
      setNotifications(newNotifications.sort((a, b) => b.timestamp - a.timestamp));
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const markAsRead = (notificationId) => {
    const newNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.isRead).length);
  };

  const markAllAsRead = () => {
    const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(newNotifications);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'package-expiring':
        return <AlertTriangle size={20} className="notification-icon" />;
      case 'package-empty':
        return <DollarSign size={20} className="notification-icon" />;
      default:
        return <Bell size={20} className="notification-icon" />;
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
      <div className="notification-toggle" onClick={handleToggle}>
        <Bell size={24} color="#8f5fe8" />
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount}</div>
        )}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            <button className="close-notifications" onClick={handleToggle}>
              <X size={20} />
            </button>
          </div>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notification-item ${!n.isRead ? 'unread' : ''} ${getNotificationClass(n.type)}`}
                  onClick={() => markAsRead(n.id)}
                >
                  {getNotificationIcon(n.type)}
                  <div className="notification-content">
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <small>{new Date(n.timestamp).toLocaleString()}</small>
                  </div>
                  {!n.isRead && <div className="unread-indicator"></div>}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>새로운 알림이 없습니다.</p>
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="mark-all-read" onClick={markAllAsRead}>
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
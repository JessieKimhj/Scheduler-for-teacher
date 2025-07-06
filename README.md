# Teacher Schedule Management App

This app is built for my real-life friend who is a private lesson teacher.  
It’s designed to help him manage his students, lessons, and packages more easily and effectively.

## Tech Stack

- **Frontend**: React 19, Vite  
- **UI Library**: React Big Calendar, Lucide React  
- **Styling**: CSS3 
- **Backend**: Firebase Firestore, Node.js (API integration)  
- **Authentication**: Firebase Auth 
- **Hosting**: Firebase Hosting

### Installation & Running the app

```bash
npm install
npm run dev
```

## Key Features

### 📅 Schedule Management
- **Calendar-based Scheduling**: View schedules by week or month  
- **Drag and Drop**: Easily adjust lesson times  
- **Time Slot Selection**: Assign lessons to desired time slots  

### 👥 Student Management
- **Student Info Registration**: Name, contact, email  
- **Lesson Type Configuration**: 1:1 or 1:2 lessons  
- **Lesson Frequency**: Weekly or biweekly  

### 📦 Package Management
- **Package Creation**: Various options (4, 8, 12 lessons, etc.)  
- **Auto Calculation**: Automatically track remaining lessons  
- **Price Settings**: Set price per package  

### 🔔 Notification System
- **Package Expiry Alerts**: Alert when 2 or fewer lessons remain  
- **Payment Reminders**: Notify when package is fully used  
- **Real-Time Updates**: Auto-refresh every 5 minutes  

### 📊 Dashboard
- **Student List**: View student info and package status  
- **Package Overview**: Active packages and remaining lessons  
- **Notification Center**: Easily view all alerts in one place  

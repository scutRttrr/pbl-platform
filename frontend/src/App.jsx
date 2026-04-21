import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TeacherDashboard from './pages/teacher/Dashboard';
import PlanGenerator from './pages/teacher/PlanGenerator';
import TaskManagement from './pages/teacher/TaskManagement';
import ProcessData from './pages/teacher/ProcessData';
import Evaluation from './pages/teacher/Evaluation';
import DecisionSupport from './pages/teacher/DecisionSupport';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTasks from './pages/student/StudentTasks';
import StudentReport from './pages/student/StudentReport';
import TeamChat from './pages/student/TeamChat';
import FileUpload from './pages/student/FileUpload';
import StudentProgress from './pages/student/StudentProgress';

function AppContent() {
  const [role, setRole] = useState('teacher');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (role === 'teacher' && location.pathname.startsWith('/student')) {
      navigate('/teacher/dashboard');
    } else if (role === 'student' && location.pathname.startsWith('/teacher')) {
      navigate('/student/dashboard');
    }
  }, [role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    navigate(newRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
  };

  return (
    <div className="app-layout">
      <Sidebar role={role} onRoleChange={handleRoleChange} />
      <main className="main-content">
        <Routes>
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/plan-generator" element={<PlanGenerator />} />
          <Route path="/teacher/task-management" element={<TaskManagement />} />
          <Route path="/teacher/process-data" element={<ProcessData />} />
          <Route path="/teacher/evaluation" element={<Evaluation />} />
          <Route path="/teacher/decision-support" element={<DecisionSupport />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/tasks" element={<StudentTasks />} />
          <Route path="/student/progress" element={<StudentProgress />} />
          <Route path="/student/chat" element={<TeamChat />} />
          <Route path="/student/files" element={<FileUpload />} />
          <Route path="/student/report" element={<StudentReport />} />

          {/* Default */}
          <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
        </Routes>
      </main>

      {/* Role Switcher */}
      <div className="role-switcher">
        <button
          className={`role-btn teacher ${role === 'teacher' ? 'active' : ''}`}
          onClick={() => handleRoleChange('teacher')}
        >
          👨‍🏫 教师端
        </button>
        <button
          className={`role-btn student ${role === 'student' ? 'active' : ''}`}
          onClick={() => handleRoleChange('student')}
        >
          👨‍🎓 学生端
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import KanbanBoard from './pages/KanbanBoard';
import Leaderboard from './pages/Leaderboard';
import JudgeDashboard from './pages/JudgesDashboard';
function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kanban/:teamId" element={<KanbanBoard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/judge" element={<JudgeDashboard />} />
      </Routes>
    </Router>
  );
}
export default App;
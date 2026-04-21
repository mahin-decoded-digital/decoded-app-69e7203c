import { Navigate, Route, Routes } from 'react-router-dom';
import NotFoundPage from '@/pages/not-found-page';
import SyncPage from '@/pages/sync-page';
import TasksPage from '@/pages/tasks-page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TasksPage />} />
      <Route path="/tasks" element={<Navigate to="/" replace />} />
      <Route path="/sync" element={<SyncPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

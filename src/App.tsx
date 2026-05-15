import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { seedIfEmpty } from './db/seed';
import Layout from './components/Layout';
import TopPage from './pages/TopPage';
import CreateShiftPage from './pages/CreateShiftPage';
import ShiftRequestPage from './pages/ShiftRequestPage';
import ShiftResultPage from './pages/ShiftResultPage';
import MasterPage from './pages/MasterPage';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty()
      .catch((err) => {
        console.error('seedIfEmpty failed:', err);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<TopPage />} />
          <Route path="shift/create" element={<CreateShiftPage />} />
          <Route path="shift/request" element={<ShiftRequestPage />} />
          <Route path="shift/result" element={<ShiftResultPage />} />
          <Route path="master" element={<MasterPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

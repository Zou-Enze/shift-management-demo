import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { db } from '../db/database';
import SummaryCards from './shiftResult/SummaryCards';
import TaskAxisTable from './shiftResult/TaskAxisTable';
import GanttChart from './shiftResult/GanttChart';
import type { Category, ShiftRequest, ShiftResult } from '../types';

export default function ShiftResultPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'task' | 'staff'>('task');

  const results = useLiveQuery(() => db.shift_results.toArray(), []) as ShiftResult[] | undefined;
  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const shiftRequests = useLiveQuery(() => db.shift_requests.toArray(), []) as ShiftRequest[] | undefined;

  if (!results || !categories || !shiftRequests) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const result = results[0];

  if (!result) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 6 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }} elevation={0}>
          <Typography>シフト結果がまだ作成されていません。</Typography>
          <Button onClick={() => navigate('/shift/create')} sx={{ mt: 2 }}>
            入力に戻る
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ color: 'primary.main', mb: 3 }}>
          サマリ
        </Typography>
        <SummaryCards summary={result.summary} />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab value="task" label="作業軸" sx={{ fontWeight: 600 }} />
        <Tab value="staff" label="人員軸" sx={{ fontWeight: 600 }} />
      </Tabs>

      {tab === 'task' ? (
        <Box sx={{ mb: 6 }}>
          <TaskAxisTable
          assignments={result.assignments}
          categories={categories}
          shiftRequests={shiftRequests}
          resultDate={result.period_start}
        />
        </Box>
      ) : (
        <Box sx={{ mb: 6 }}>
          <GanttChart assignments={result.assignments} categories={categories} />
        </Box>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 6 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/shift/create')}
          sx={{ px: 4, py: 1.5 }}
        >
          入力に戻る
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => alert('導出機能は実装予定です')}
          sx={{ px: 4, py: 1.5 }}
        >
          Excelエクスポート
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => alert('導出機能は実装予定です')}
          sx={{ px: 4, py: 1.5 }}
        >
          PDFエクスポート
        </Button>
      </Stack>
    </Box>
  );
}

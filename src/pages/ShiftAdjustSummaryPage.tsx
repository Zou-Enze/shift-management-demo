import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import TaskAxisTable from './shiftResult/TaskAxisTable';
import BeforeAfterCards from './shiftAdjust/BeforeAfterCards';
import type { Category, DailyAdjustSummary, ShiftRequest } from '../types';

interface LocationState {
  date: string;
}

export default function ShiftAdjustSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const date = state?.date ?? '';

  const summaries = useLiveQuery(
    () => db.daily_adjust_summaries.where('date').equals(date).toArray(),
    [date]
  ) as DailyAdjustSummary[] | undefined;

  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const shiftRequests = useLiveQuery(() => db.shift_requests.toArray(), []) as ShiftRequest[] | undefined;

  if (!summaries || !categories || !shiftRequests) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summary = summaries[summaries.length - 1];

  if (!summary) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'text.secondary', mb: 4 }}
        >
          戻る
        </Button>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #E0E0E0' }}>
          <Typography color="text.secondary">
            サマリデータがありません。
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: 'auto',
        width: '100%',
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ color: 'text.secondary', mb: 4 }}
      >
        戻る
      </Button>

      <Typography
        variant="h3"
        sx={{
          color: 'primary.main',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          mb: 2,
        }}
      >
        サマリ
      </Typography>

      {date && (
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'Montserrat, sans-serif', mb: 3 }}
        >
          {date}
        </Typography>
      )}

      {summary.before_summary && summary.after_summary && (
        <BeforeAfterCards before={summary.before_summary} after={summary.after_summary} />
      )}

      <TaskAxisTable
        assignments={summary.assignments}
        categories={categories}
        shiftRequests={shiftRequests}
        resultDate={date}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 6 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ px: 4, py: 1.5 }}
        >
          戻る
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

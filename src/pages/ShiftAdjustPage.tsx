import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/EditOutlined';
import { parseExcelFile } from './shiftAdjust/adjustUtils';
import AdjustTable from './shiftAdjust/AdjustTable';
import type { AdjustRow } from './shiftAdjust/adjustTypes';

export default function ShiftAdjustPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<AdjustRow[]>([]);
  const [date, setDate] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await parseExcelFile(file);
      setRows(result.rows);
      setDate(result.date);
    } catch {
      setError('Excelファイルの読み込みに失敗しました。ファイル形式を確認してください。');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGoToEdit = () => {
    navigate('/shift/adjust/edit', { state: { rows, date, initialRows: rows } });
  };

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
      {/* ページタイトル */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/home')}
          sx={{ color: 'text.secondary' }}
        >
          トップに戻る
        </Button>
      </Stack>

      <Typography variant="h3" sx={{ color: 'primary.main', mb: 4 }}>
        既存シフト調整
      </Typography>

      {/* アップロードエリア */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #DCD9D9',
          borderRadius: 2,
          p: 4,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          シフトアップロード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          既存シフトのExcelファイルをアップロードしてください
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
          onClick={handleUploadClick}
          disabled={uploading}
          sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, px: 4 }}
        >
          {uploading ? 'アップロード中...' : 'シフトアップロード'}
        </Button>

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
      </Paper>

      {/* アップロード後の一覧 */}
      {rows.length > 0 && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              {date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rows.length} 件の作業データが読み込まれました
            </Typography>
          </Box>

          <AdjustTable rows={rows} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleGoToEdit}
              sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, px: 4, py: 1.5 }}
            >
              変更箇所入力
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

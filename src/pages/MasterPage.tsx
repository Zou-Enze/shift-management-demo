import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, Snackbar, Alert } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CategoryManager from './master/CategoryManager';
import SkillManager from './master/SkillManager';
import EmployeeManager from './master/EmployeeManager';
import ConfirmDialog from '../components/ConfirmDialog';
import { resetDatabase } from '../db/seed';

export default function MasterPage() {
  const [tab, setTab] = useState<'category' | 'skill' | 'employee'>('category');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; success: boolean }>({ open: false, success: true });

  const handleReset = async () => {
    try {
      await resetDatabase();
      setSnackbar({ open: true, success: true });
    } catch {
      setSnackbar({ open: true, success: false });
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h2" sx={{ color: 'primary.main' }}>
          マスタ設定
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestartAltIcon />}
          onClick={() => setConfirmOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          データ初期化
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab value="category" label="カテゴリ管理" sx={{ fontWeight: 600 }} />
        <Tab value="skill" label="スキル管理" sx={{ fontWeight: 600 }} />
        <Tab value="employee" label="要員管理" sx={{ fontWeight: 600 }} />
      </Tabs>

      {tab === 'category' && <CategoryManager />}
      {tab === 'skill' && <SkillManager />}
      {tab === 'employee' && <EmployeeManager />}

      <ConfirmDialog
        open={confirmOpen}
        title="データ初期化"
        message="現在のデータをすべてクリアし、初期データに戻します。この操作は取り消せません。続行しますか？"
        confirmLabel="初期化する"
        onConfirm={handleReset}
        onClose={() => setConfirmOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.success ? 'success' : 'error'}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.success ? 'データを初期化しました' : 'データの初期化に失敗しました'}
        </Alert>
      </Snackbar>
    </Box>
  );
}

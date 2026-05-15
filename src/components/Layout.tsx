import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Box, IconButton, Toolbar, Typography, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

const APP_BAR_HEIGHT = 64;

const TITLES: Record<string, string> = {
  '/home': 'トップ画面',
  '/shift/create': '新規シフト作成',
  '/shift/result': 'シフト結果',
  '/master': 'マスタ設定',
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'シフト管理システム';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: '#DCD9D9',
          height: APP_BAR_HEIGHT,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: `${APP_BAR_HEIGHT}px` }}>
          <Tooltip title="ホーム">
            <IconButton
              onClick={() => navigate('/home')}
              sx={{ color: 'primary.light', '&:hover': { bgcolor: 'rgba(82,75,144,0.05)' } }}
              aria-label="ホーム"
            >
              <HomeIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Tooltip>

          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontSize: '20px', fontWeight: 700 }}>
            {title}
          </Typography>

          <Tooltip title="マスタ設定">
            <IconButton
              onClick={() => navigate('/master')}
              sx={{
                color: location.pathname === '/master' ? 'primary.main' : 'primary.light',
                '&:hover': { bgcolor: 'rgba(82,75,144,0.05)' },
              }}
              aria-label="マスタ設定"
            >
              <SettingsIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: `${APP_BAR_HEIGHT}px` }} />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

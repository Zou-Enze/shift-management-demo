import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import CategoryManager from './master/CategoryManager';
import SkillManager from './master/SkillManager';
import EmployeeManager from './master/EmployeeManager';

export default function MasterPage() {
  const [tab, setTab] = useState<'category' | 'skill' | 'employee'>('category');

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
      <Typography variant="h2" sx={{ color: 'primary.main', mb: 4 }}>
        マスタ設定
      </Typography>

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
    </Box>
  );
}

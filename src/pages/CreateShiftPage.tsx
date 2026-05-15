import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  IconButton,
  Backdrop,
  CircularProgress,
  Fab,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import SetTaskDialog from '../components/SetTaskDialog';
import { db } from '../db/database';
import { getCategorySmallColor } from '../constants/categoryColors';
import { formatTaskDateTime } from '../utils/taskDateTime';
import type { Category, Skill, Employee, ShiftRequest, TaskRow } from '../types';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateShiftPage() {
  const navigate = useNavigate();

  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const skills = useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined;
  const employees = useLiveQuery(() => db.employees.toArray(), []) as Employee[] | undefined;
  const requests = useLiveQuery(() => db.shift_requests.toArray(), []) as ShiftRequest[] | undefined;
  const taskRows = useLiveQuery(() => db.task_rows.toArray(), []) as TaskRow[] | undefined;

  const [targetDate, setTargetDate] = useState<string>(today());
  const [loading, setLoading] = useState(false);
  const [setTaskOpen, setSetTaskOpen] = useState(false);

  const skillMap = useMemo(() => {
    const m = new Map<string, string>();
    (skills ?? []).forEach((s) => m.set(s.id, s.name));
    return m;
  }, [skills]);

  const subCategoryMap = useMemo(() => {
    const m = new Map<string, { name: string; largeName: string }>();
    (categories ?? []).forEach((c) => {
      c.sub_categories.forEach((sc) => m.set(sc.id, { name: sc.name, largeName: c.name }));
    });
    return m;
  }, [categories]);

  const handleAddRequest = async () => {
    const first = employees?.[0];
    if (!first) return;
    await db.shift_requests.add({
      id: newId('REQ'),
      date: targetDate.replace(/-/g, '/'),
      employee_id: first.id,
      employee_name: first.name,
      preferred_start: '09:00',
      preferred_end: '17:00',
    });
  };

  const handleUpdateRequest = async (id: string, changes: Partial<ShiftRequest>) => {
    await db.shift_requests.update(id, changes);
  };

  const handleEmployeeChange = async (id: string, employeeId: string) => {
    const emp = employees?.find((e) => e.id === employeeId);
    if (!emp) return;
    await db.shift_requests.update(id, { employee_id: emp.id, employee_name: emp.name });
  };

  const handleRemoveRequest = async (id: string) => {
    await db.shift_requests.delete(id);
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/shift/result');
    }, 1500);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 }, pb: 16 }}>
      <Typography variant="h1" sx={{ color: 'primary.main', mb: 6, fontSize: { xs: '32px', md: '48px' } }}>
        新規シフト作成
      </Typography>

      <Paper
        sx={{
          p: 4,
          mb: 6,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
        elevation={0}
      >
        <TextField
          label="対象日"
          type="date"
          size="small"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Paper>

      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <AssignmentIcon sx={{ color: 'primary.light' }} />
          <Typography variant="h3">作業内容入力</Typography>
        </Stack>

        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#524B90' }}>
                {['カテゴリ小', '開始時間', '終了時間', '作業内容', 'スキル', '必要人数'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em' }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(taskRows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 4, color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}>
                    まだ作業内容が登録されていません。下のボタンから追加してください。
                  </TableCell>
                </TableRow>
              ) : (
                (taskRows ?? []).map((row) => {
                  const small = subCategoryMap.get(row.category_small_id);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ borderLeft: `4px solid ${getCategorySmallColor(row.category_small_id)}` }}>
                        {small?.name ?? row.category_small_id}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatTaskDateTime(row.task_date, row.start_time, targetDate)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatTaskDateTime(row.task_date, row.end_time, targetDate)}
                      </TableCell>
                      <TableCell>{row.task_name}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            bgcolor: '#F0EDED',
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {skillMap.get(row.skill_id) ?? row.skill_id}
                        </Box>
                      </TableCell>
                      <TableCell>{row.required_count}名</TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 0 }}>
                  <Button
                    fullWidth
                    startIcon={<AddCircleIcon />}
                    onClick={() => setSetTaskOpen(true)}
                    sx={{
                      py: 2,
                      color: 'text.secondary',
                      fontWeight: 600,
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(82,75,144,0.04)' },
                    }}
                  >
                    作業内容を追加する
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <GroupsIcon sx={{ color: 'primary.light' }} />
          <Typography variant="h3">シフト希望表入力</Typography>
        </Stack>

        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#524B90' }}>
                {['日付', '要員ID', '要員名', '希望開始時間', '希望終了時間', '操作'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.05em',
                      textAlign: h === '操作' ? 'center' : 'left',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(requests ?? []).map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell>
                    <TextField
                      type="text"
                      value={req.date}
                      size="small"
                      onChange={(e) => handleUpdateRequest(req.id, { date: e.target.value })}
                      sx={{ width: 140 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={req.employee_id}
                      onChange={(e) => handleEmployeeChange(req.id, e.target.value)}
                      sx={{ minWidth: 130 }}
                    >
                      {(employees ?? []).map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>{req.employee_name}</TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={req.preferred_start}
                      onChange={(e) => handleUpdateRequest(req.id, { preferred_start: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      size="small"
                      value={req.preferred_end}
                      onChange={(e) => handleUpdateRequest(req.id, { preferred_end: e.target.value })}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="error" size="small" onClick={() => handleRemoveRequest(req.id)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 0 }}>
                  <Button
                    fullWidth
                    startIcon={<AddCircleIcon />}
                    onClick={handleAddRequest}
                    sx={{
                      py: 2,
                      color: 'text.secondary',
                      fontWeight: 600,
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(82,75,144,0.04)' },
                    }}
                  >
                    シフト希望を追加する
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Fab
        color="primary"
        variant="extended"
        onClick={handleSubmit}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          px: 4,
          py: 1.5,
          fontSize: '16px',
          fontWeight: 700,
          boxShadow: '0px 10px 30px rgba(82,75,144,0.25)',
        }}
      >
        <BoltIcon sx={{ mr: 1 }} />
        シフト作成
      </Fab>

      <Backdrop open={loading} sx={{ zIndex: (t) => t.zIndex.modal + 1, color: '#fff', flexDirection: 'column', gap: 2 }}>
        <CircularProgress color="inherit" />
        <Typography sx={{ color: '#fff' }}>シフトを作成しています...</Typography>
      </Backdrop>

      <SetTaskDialog
        open={setTaskOpen}
        onClose={() => setSetTaskOpen(false)}
        onApplied={(iso) => setTargetDate(iso)}
      />
    </Box>
  );
}

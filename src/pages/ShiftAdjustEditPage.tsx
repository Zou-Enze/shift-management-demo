import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Category, Skill } from '../types';
import AdjustTable from './shiftAdjust/AdjustTable';
import type { AdjustEmployee, AdjustRow } from './shiftAdjust/adjustTypes';

interface LocationState {
  rows: AdjustRow[];
  date: string;
}

interface NewTaskForm {
  categorySmall: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  taskContent: string;
  skill: string;
  requiredCount: number;
}

interface DialogState {
  row: AdjustRow;
  tab: number;
  newTask: NewTaskForm;
  newRequiredCount: number;
  absentIds: Set<string>;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export default function ShiftAdjustEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const date = state?.date ?? '';

  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const skills = useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined;

  const [rows, setRows] = useState<AdjustRow[]>(state?.rows ?? []);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const subCategories = useMemo(() => {
    if (!dialog || !categories) return [];
    const cat = categories.find((c) => c.name === dialog.row.categoryLarge);
    return cat?.sub_categories ?? [];
  }, [dialog, categories]);

  const handleRowChange = (row: AdjustRow) => {
    setDialog({
      row,
      tab: 0,
      newTask: {
        categorySmall: row.categorySmall,
        startHour: '',
        startMinute: '00',
        endHour: '',
        endMinute: '00',
        taskContent: '',
        skill: row.skill,
        requiredCount: 1,
      },
      newRequiredCount: row.requiredCount,
      absentIds: new Set(row.absentEmployees.map((e) => e.id)),
    });
  };

  const handleDialogClose = () => setDialog(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (!dialog) return;
    setDialog({ ...dialog, tab: newValue });
  };

  const handleAddNewTask = () => {
    if (!dialog) return;
    const { newTask, row } = dialog;
    if (!newTask.categorySmall || !newTask.startHour || !newTask.endHour) return;

    const startTime = `${newTask.startHour}:${newTask.startMinute}`;
    const endTime = `${newTask.endHour}:${newTask.endMinute}`;
    const datePrefix = date ? `${date} ` : '';
    const newRow: AdjustRow = {
      id: `adj-new-${Date.now()}`,
      categoryLarge: row.categoryLarge,
      categorySmall: newTask.categorySmall,
      startDateTime: `${datePrefix}${startTime}`,
      endDateTime: `${datePrefix}${endTime}`,
      taskContent: newTask.taskContent,
      skill: newTask.skill,
      requiredCount: newTask.requiredCount,
      assignedEmployees: [],
      absentEmployees: [],
    };
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });
    handleDialogClose();
  };

  const handleChangeRequiredCount = () => {
    if (!dialog) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === dialog.row.id ? { ...r, requiredCount: dialog.newRequiredCount } : r
      )
    );
    handleDialogClose();
  };

  const handleAbsenceConfirm = () => {
    if (!dialog) return;
    const absentEmployees: AdjustEmployee[] = dialog.row.assignedEmployees.filter((e) =>
      dialog.absentIds.has(e.id)
    );
    setRows((prev) =>
      prev.map((r) => (r.id === dialog.row.id ? { ...r, absentEmployees } : r))
    );
    handleDialogClose();
  };

  const toggleAbsent = (emp: AdjustEmployee) => {
    if (!dialog) return;
    const next = new Set(dialog.absentIds);
    if (next.has(emp.id)) {
      next.delete(emp.id);
    } else {
      next.add(emp.id);
    }
    setDialog({ ...dialog, absentIds: next });
  };

  if (!state?.rows) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
        <Typography color="text.secondary">
          シフトデータがありません。先に既存シフト調整ページからアップロードしてください。
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/shift/adjust')}
          sx={{ mt: 2 }}
        >
          戻る
        </Button>
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
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/shift/adjust')}
          sx={{ color: 'text.secondary' }}
        >
          戻る
        </Button>
      </Stack>

      <Typography variant="h3" sx={{ color: 'primary.main', mb: 2 }}>
        既存シフト調整_変更
      </Typography>

      {date && (
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
          {date}
        </Typography>
      )}

      <AdjustTable rows={rows} onRowChange={handleRowChange} />

      {/* 変更ダイアログ */}
      <Dialog open={!!dialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          変更 — {dialog?.row.categorySmall}
        </DialogTitle>

        <Tabs
          value={dialog?.tab ?? 0}
          onChange={handleTabChange}
          sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="新しい作業追加" />
          <Tab label="要員数変更" />
          <Tab label="欠席処理" />
        </Tabs>

        <DialogContent sx={{ pt: 3 }}>
          {/* タブ 0: 新しい作業追加 */}
          {dialog?.tab === 0 && (
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>カテゴリ小</InputLabel>
                <Select
                  label="カテゴリ小"
                  value={dialog.newTask.categorySmall}
                  onChange={(e) =>
                    setDialog((d) =>
                      d ? { ...d, newTask: { ...d.newTask, categorySmall: e.target.value } } : d
                    )
                  }
                >
                  {subCategories.map((sc) => (
                    <MenuItem key={sc.id} value={sc.name}>{sc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>開始時</InputLabel>
                  <Select
                    label="開始時"
                    value={dialog.newTask.startHour}
                    onChange={(e) =>
                      setDialog((d) =>
                        d ? { ...d, newTask: { ...d.newTask, startHour: e.target.value } } : d
                      )
                    }
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <MenuItem key={h} value={h}>{h}時</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>開始分</InputLabel>
                  <Select
                    label="開始分"
                    value={dialog.newTask.startMinute}
                    onChange={(e) =>
                      setDialog((d) =>
                        d ? { ...d, newTask: { ...d.newTask, startMinute: e.target.value } } : d
                      )
                    }
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>{m}分</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography sx={{ mx: 0.5, color: 'text.secondary' }}>〜</Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>終了時</InputLabel>
                  <Select
                    label="終了時"
                    value={dialog.newTask.endHour}
                    onChange={(e) =>
                      setDialog((d) =>
                        d ? { ...d, newTask: { ...d.newTask, endHour: e.target.value } } : d
                      )
                    }
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <MenuItem key={h} value={h}>{h}時</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>終了分</InputLabel>
                  <Select
                    label="終了分"
                    value={dialog.newTask.endMinute}
                    onChange={(e) =>
                      setDialog((d) =>
                        d ? { ...d, newTask: { ...d.newTask, endMinute: e.target.value } } : d
                      )
                    }
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>{m}分</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <FormControl size="small" fullWidth>
                <InputLabel>スキル</InputLabel>
                <Select
                  label="スキル"
                  value={dialog.newTask.skill}
                  onChange={(e) =>
                    setDialog((d) =>
                      d ? { ...d, newTask: { ...d.newTask, skill: e.target.value } } : d
                    )
                  }
                >
                  {(skills ?? []).map((s) => (
                    <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="要員数"
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                value={dialog.newTask.requiredCount}
                onChange={(e) =>
                  setDialog((d) =>
                    d
                      ? {
                          ...d,
                          newTask: {
                            ...d.newTask,
                            requiredCount: Math.max(1, Number(e.target.value)),
                          },
                        }
                      : d
                  )
                }
              />
            </Stack>
          )}

          {/* タブ 1: 要員数変更 */}
          {dialog?.tab === 1 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  現在の要員数
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {dialog.row.requiredCount} 名
                </Typography>
              </Box>
              <Divider />
              <TextField
                label="新しい要員数"
                type="number"
                size="small"
                inputProps={{ min: 1 }}
                value={dialog.newRequiredCount}
                onChange={(e) =>
                  setDialog((d) =>
                    d ? { ...d, newRequiredCount: Math.max(1, Number(e.target.value)) } : d
                  )
                }
              />
            </Stack>
          )}

          {/* タブ 2: 欠席処理 */}
          {dialog?.tab === 2 && (
            <Stack spacing={1}>
              {dialog.row.assignedEmployees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  割当要員がいません
                </Typography>
              ) : (
                dialog.row.assignedEmployees.map((emp) => (
                  <FormControlLabel
                    key={emp.id}
                    control={
                      <Checkbox
                        checked={dialog.absentIds.has(emp.id)}
                        onChange={() => toggleAbsent(emp)}
                        color="error"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {emp.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.id}
                        </Typography>
                      </Box>
                    }
                  />
                ))
              )}
              {dialog.row.assignedEmployees.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  チェックした要員を欠席として処理します
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDialogClose} variant="outlined">
            キャンセル
          </Button>
          {dialog?.tab === 0 && (
            <Button
              variant="contained"
              onClick={handleAddNewTask}
              disabled={!dialog.newTask.startHour || !dialog.newTask.endHour}
              sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
            >
              追加
            </Button>
          )}
          {dialog?.tab === 1 && (
            <Button
              variant="contained"
              onClick={handleChangeRequiredCount}
              sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
            >
              変更
            </Button>
          )}
          {dialog?.tab === 2 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleAbsenceConfirm}
            >
              確定
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

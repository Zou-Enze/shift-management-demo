import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Backdrop,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddBoxIcon from '@mui/icons-material/AddBoxOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import EditIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { db } from '../db/database';
import { getCategorySmallColor } from '../constants/categoryColors';
import { isoDateToSlash, todayIsoDate } from '../utils/taskDateTime';
import type { Assignment, AssignedEmployee, Category, Skill, TaskRow, Mode } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

interface SkillConfig {
  id: string;
  skill_id: string;
  start_time: string;
  end_time: string;
  task_name: string;
  required_count: number;
}

interface SmallConfig {
  category_small_id: string;
  category_small_name: string;
  skills: SkillConfig[];
}

type TaskConfig = Record<string, SmallConfig[]>;

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function CreateShiftPage() {
  const navigate = useNavigate();

  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const skills = useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined;
  const modes = useLiveQuery(() => db.modes.toArray(), []) as Mode[] | undefined;
  const existingTaskRows = useLiveQuery(() => db.task_rows.toArray(), []) as TaskRow[] | undefined;

  const [taskTargetDateIso, setTaskTargetDateIso] = useState<string>(todayIsoDate());
  const [taskModeId, setTaskModeId] = useState<string>('');
  const [selectedLargeIds, setSelectedLargeIds] = useState<string[]>([]);
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({});
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [largeDialogOpen, setLargeDialogOpen] = useState(false);
  const [smallDialogForLarge, setSmallDialogForLarge] = useState<string | null>(null);
  const [skillDialogState, setSkillDialogState] = useState<{ largeId: string; smallId: string } | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingCount, setEditingCount] = useState<number>(1);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newWorkloadName, setNewWorkloadName] = useState('');
  const [reflected, setReflected] = useState(false);
  const [reflectConfirmOpen, setReflectConfirmOpen] = useState(false);

  const skillMap = useMemo(() => {
    const m = new Map<string, string>();
    (skills ?? []).forEach((s) => m.set(s.id, s.name));
    return m;
  }, [skills]);

  const buildConfigFromWorkload = (workload: Mode) => {
    if (!workload.preset_categories || !categories) return null;

    const newSelectedLargeIds: string[] = [];
    const newTaskConfig: TaskConfig = {};

    workload.preset_categories.forEach((large) => {
      newSelectedLargeIds.push(large.category_large_id);
      const cat = categories.find((c) => c.id === large.category_large_id);

      newTaskConfig[large.category_large_id] = large.small_categories.map((small) => {
        const subCat = cat?.sub_categories.find((sc) => sc.id === small.category_small_id);
        return {
          category_small_id: small.category_small_id,
          category_small_name: subCat?.name ?? small.category_small_id,
          skills: small.tasks.map((task) => ({
            id: uid('SK'),
            skill_id: task.skill_id,
            start_time: task.start_time,
            end_time: task.end_time,
            task_name: skillMap.get(task.skill_id) ?? task.skill_id,
            required_count: task.required_count,
          })),
        };
      });
    });

    return { newSelectedLargeIds, newTaskConfig };
  };

  useEffect(() => {
    if (hydrated) return;
    if (!categories || !modes || !skills) return;

    const todaySlash = isoDateToSlash(todayIsoDate());
    const todayRows = (existingTaskRows ?? []).filter((row) => row.task_date === todaySlash);

    if (todayRows.length > 0) {
      const subNameMap = new Map<string, string>();
      const subToLarge = new Map<string, string>();
      categories.forEach((c) =>
        c.sub_categories.forEach((sc) => {
          subNameMap.set(sc.id, sc.name);
          subToLarge.set(sc.id, c.id);
        })
      );
      const cfg: TaskConfig = {};
      const largeSet = new Set<string>();
      todayRows.forEach((row) => {
        const largeId = row.category_large_id || subToLarge.get(row.category_small_id) || '';
        if (!largeId) return;
        largeSet.add(largeId);
        if (!cfg[largeId]) cfg[largeId] = [];
        let small = cfg[largeId].find((s) => s.category_small_id === row.category_small_id);
        if (!small) {
          small = {
            category_small_id: row.category_small_id,
            category_small_name: subNameMap.get(row.category_small_id) ?? row.category_small_id,
            skills: [],
          };
          cfg[largeId].push(small);
        }
        small.skills.push({
          id: row.id,
          skill_id: row.skill_id,
          start_time: row.start_time,
          end_time: row.end_time,
          task_name: row.task_name,
          required_count: row.required_count,
        });
      });
      setSelectedLargeIds(Array.from(largeSet));
      setTaskConfig(cfg);
      setTaskTargetDateIso(todayIsoDate());
      setHydrated(true);
      return;
    }

    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, existingTaskRows, hydrated, modes, skills]);

  const isConfigModified = (): boolean => {
    if (!taskModeId) return true;
    const selectedMode = modes?.find((m) => m.id === taskModeId);
    if (!selectedMode || selectedMode.is_custom) return true;
    if (!selectedMode.preset_categories) return true;

    const presetLargeIds = selectedMode.preset_categories.map((p) => p.category_large_id).sort();
    const currentLargeIds = [...selectedLargeIds].sort();
    if (JSON.stringify(presetLargeIds) !== JSON.stringify(currentLargeIds)) return true;

    for (const large of selectedMode.preset_categories) {
      const largeId = large.category_large_id;
      const currentSmalls = taskConfig[largeId] ?? [];
      const presetSmalls = large.small_categories;

      const currentSmallIds = currentSmalls.map((s) => s.category_small_id).sort();
      const presetSmallIds = presetSmalls.map((s) => s.category_small_id).sort();
      if (JSON.stringify(currentSmallIds) !== JSON.stringify(presetSmallIds)) return true;

      for (const presetSmall of presetSmalls) {
        const currentSmall = currentSmalls.find((s) => s.category_small_id === presetSmall.category_small_id);
        if (!currentSmall) return true;

        if (currentSmall.skills.length !== presetSmall.tasks.length) return true;

        const sortedCurrent = [...currentSmall.skills].sort((a, b) =>
          `${a.skill_id}${a.start_time}${a.end_time}`.localeCompare(`${b.skill_id}${b.start_time}${b.end_time}`)
        );
        const sortedPreset = [...presetSmall.tasks].sort((a, b) =>
          `${a.skill_id}${a.start_time}${a.end_time}`.localeCompare(`${b.skill_id}${b.start_time}${b.end_time}`)
        );

        for (let i = 0; i < sortedCurrent.length; i++) {
          const c = sortedCurrent[i];
          const p = sortedPreset[i];
          if (
            c.skill_id !== p.skill_id ||
            c.start_time !== p.start_time ||
            c.end_time !== p.end_time ||
            c.required_count !== p.required_count
          ) return true;
        }
      }
    }
    return false;
  };

  const handleModeChange = (modeId: string) => {
    setTaskModeId(modeId);
    setReflected(false);
    if (!modeId) {
      setSelectedLargeIds([]);
      setTaskConfig({});
      return;
    }
    const workload = modes?.find((m) => m.id === modeId);
    if (!workload || !workload.preset_categories) return;
    const result = buildConfigFromWorkload(workload);
    if (result) {
      setSelectedLargeIds(result.newSelectedLargeIds);
      setTaskConfig(result.newTaskConfig);
    }
  };

  const availableLargeCategories = useMemo(
    () => (categories ?? []).filter((c) => !selectedLargeIds.includes(c.id)),
    [categories, selectedLargeIds]
  );

  const addLargeCategory = (largeId: string) => {
    setSelectedLargeIds((prev) => [...prev, largeId]);
    setTaskConfig((prev) => ({ ...prev, [largeId]: prev[largeId] ?? [] }));
    setLargeDialogOpen(false);
    setReflected(false);
  };

  const removeLargeCategory = (largeId: string) => {
    setSelectedLargeIds((prev) => prev.filter((id) => id !== largeId));
    setTaskConfig((prev) => {
      const next = { ...prev };
      delete next[largeId];
      return next;
    });
    setReflected(false);
  };

  const addSmallCategory = (largeId: string, smallId: string, smallName: string) => {
    setTaskConfig((prev) => {
      const list = prev[largeId] ?? [];
      if (list.some((s) => s.category_small_id === smallId)) return prev;
      return {
        ...prev,
        [largeId]: [...list, { category_small_id: smallId, category_small_name: smallName, skills: [] }],
      };
    });
    setSmallDialogForLarge(null);
    setReflected(false);
  };

  const removeSmallCategory = (largeId: string, smallId: string) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).filter((s) => s.category_small_id !== smallId),
    }));
    setReflected(false);
  };

  const addSkillConfig = (largeId: string, smallId: string, cfg: Omit<SkillConfig, 'id'>) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).map((s) =>
        s.category_small_id === smallId
          ? { ...s, skills: [...s.skills, { ...cfg, id: uid('SK') }] }
          : s
      ),
    }));
    setSkillDialogState(null);
    setReflected(false);
  };

  const updateSkillCount = (largeId: string, smallId: string, skillRowId: string, count: number) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).map((s) =>
        s.category_small_id === smallId
          ? { ...s, skills: s.skills.map((sk) => (sk.id === skillRowId ? { ...sk, required_count: count } : sk)) }
          : s
      ),
    }));
    setReflected(false);
  };

  const removeSkill = (largeId: string, smallId: string, skillRowId: string) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).map((s) =>
        s.category_small_id === smallId ? { ...s, skills: s.skills.filter((sk) => sk.id !== skillRowId) } : s
      ),
    }));
    setReflected(false);
  };

  const doReflect = async () => {
    const rows: TaskRow[] = [];
    Object.entries(taskConfig).forEach(([largeId, smalls]) => {
      smalls.forEach((small) => {
        small.skills.forEach((sk) => {
          rows.push({
            id: sk.id,
            category_large_id: largeId,
            category_small_id: small.category_small_id,
            task_date: isoDateToSlash(taskTargetDateIso),
            start_time: sk.start_time,
            end_time: sk.end_time,
            task_name: sk.task_name,
            skill_id: sk.skill_id,
            required_count: sk.required_count,
          });
        });
      });
    });
    await db.task_rows.clear();
    if (rows.length > 0) await db.task_rows.bulkPut(rows);
    setReflected(true);
  };

  const handleReflect = () => {
    setReflectConfirmOpen(true);
  };

  const handleReflectConfirmed = async () => {
    if (!isConfigModified()) {
      await doReflect();
      return;
    }
    setNewWorkloadName('');
    setSaveDialogOpen(true);
  };

  const handleSaveAndReflect = async () => {
    if (newWorkloadName.trim()) {
      const preset = selectedLargeIds.map((largeId) => ({
        category_large_id: largeId,
        small_categories: (taskConfig[largeId] ?? []).map((small) => ({
          category_small_id: small.category_small_id,
          tasks: small.skills.map((sk) => ({
            skill_id: sk.skill_id,
            start_time: sk.start_time,
            end_time: sk.end_time,
            required_count: sk.required_count,
          })),
        })),
      }));
      await db.modes.add({
        id: `WL-${Date.now()}`,
        name: newWorkloadName.trim(),
        preset_categories: preset,
        is_custom: true,
      });
    }
    setSaveDialogOpen(false);
    await doReflect();
  };

  const handleSkipAndReflect = async () => {
    setSaveDialogOpen(false);
    await doReflect();
  };

  const handleSubmit = async () => {
    setLoading(true);
    await doReflect();
    await generateShiftResult();
    setTimeout(() => {
      setLoading(false);
      navigate('/shift/result');
    }, 1200);
  };

  const generateShiftResult = async () => {
    const parseH = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h + (isFinite(m) ? m / 60 : 0);
    };

    const [taskRows, allRequests, allEmployees, allCategories, allSkills] = await Promise.all([
      db.task_rows.toArray(),
      db.shift_requests.toArray(),
      db.employees.toArray(),
      db.categories.toArray(),
      db.skills.toArray(),
    ]);

    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
    const skillMap = new Map(allSkills.map((s) => [s.id, s]));
    const employeeMap = new Map(allEmployees.map((e) => [e.id, e]));
    const categoryOrder = new Map(allCategories.map((c, index) => [c.id, index]));
    const smallCategoryOrder = new Map<string, number>();
    allCategories.forEach((category) => {
      category.sub_categories.forEach((subCategory, index) => {
        smallCategoryOrder.set(subCategory.id, index);
      });
    });

    const sortedTaskRows = [...taskRows].sort((a, b) => {
      const dateCompare = (a.task_date ?? '').localeCompare(b.task_date ?? '');
      if (dateCompare !== 0) return dateCompare;

      const categoryCompare =
        (categoryOrder.get(a.category_large_id) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(b.category_large_id) ?? Number.MAX_SAFE_INTEGER);
      if (categoryCompare !== 0) return categoryCompare;

      const smallCategoryCompare =
        (smallCategoryOrder.get(a.category_small_id) ?? Number.MAX_SAFE_INTEGER) -
        (smallCategoryOrder.get(b.category_small_id) ?? Number.MAX_SAFE_INTEGER);
      if (smallCategoryCompare !== 0) return smallCategoryCompare;

      const startCompare = parseH(a.start_time) - parseH(b.start_time);
      if (startCompare !== 0) return startCompare;

      const endCompare = parseH(a.end_time) - parseH(b.end_time);
      if (endCompare !== 0) return endCompare;

      const skillCompare = a.skill_id.localeCompare(b.skill_id);
      if (skillCompare !== 0) return skillCompare;

      return a.id.localeCompare(b.id);
    });

    const sortedRequests = [...allRequests].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;

      const startCompare = parseH(a.preferred_start) - parseH(b.preferred_start);
      if (startCompare !== 0) return startCompare;

      const endCompare = parseH(a.preferred_end) - parseH(b.preferred_end);
      if (endCompare !== 0) return endCompare;

      const employeeCompare = a.employee_id.localeCompare(b.employee_id);
      if (employeeCompare !== 0) return employeeCompare;

      return a.id.localeCompare(b.id);
    });

    // 従業員ごとの予約済み時間帯（重複配置を防ぐ）
    const bookings = new Map<string, Array<{ start: number; end: number }>>();

    const assignments: Assignment[] = sortedTaskRows.map((row) => {
      const taskStart = parseH(row.start_time);
      const taskEnd = parseH(row.end_time);
      const taskDate = (row.task_date ?? '').replace(/-/g, '/');

      // 日付・時間帯が重複し、スキルが一致するシフト希望を抽出
      const eligible = sortedRequests.filter((req) => {
        if (req.date.replace(/-/g, '/') !== taskDate) return false;
        const reqStart = parseH(req.preferred_start);
        const reqEnd = parseH(req.preferred_end);
        if (reqStart >= taskEnd || reqEnd <= taskStart) return false;
        const emp = employeeMap.get(req.employee_id);
        // スキルが設定されている場合のみスキル照合
        if (emp && emp.skills.length > 0 && !emp.skills.includes(row.skill_id)) return false;
        return true;
      });

      // 必要人数まで割当（同一従業員の時間帯重複は除外）
      const assignedEmployees: AssignedEmployee[] = [];
      for (const req of eligible) {
        if (assignedEmployees.length >= row.required_count) break;
        const reqStart = parseH(req.preferred_start);
        const reqEnd = parseH(req.preferred_end);
        const empBookings = bookings.get(req.employee_id) ?? [];
        const hasConflict = empBookings.some((b) => reqStart < b.end && reqEnd > b.start);
        if (hasConflict) continue;
        assignedEmployees.push({ employee_id: req.employee_id, employee_name: req.employee_name });
        empBookings.push({ start: reqStart, end: reqEnd });
        bookings.set(req.employee_id, empBookings);
      }

      const cat = categoryMap.get(row.category_large_id);
      const subCat = cat?.sub_categories.find((sc) => sc.id === row.category_small_id);
      const skill = skillMap.get(row.skill_id);
      const shortage = Math.max(0, row.required_count - assignedEmployees.length);

      return {
        task_id: row.id,
        category_large_id: row.category_large_id,
        category_large: cat?.name ?? row.category_large_id,
        category_small_id: row.category_small_id,
        category_small: subCat?.name ?? row.category_small_id,
        start_time: row.start_time,
        end_time: row.end_time,
        task_name: row.task_name,
        skill_id: row.skill_id,
        skill: skill?.name ?? row.skill_id,
        required_count: row.required_count,
        assigned_count: assignedEmployees.length,
        shortage,
        assigned_employees: assignedEmployees,
      };
    });

    const totalAssigned = assignments.reduce((s, a) => s + a.assigned_count, 0);
    const totalHours = assignments.reduce((s, a) => s + (parseH(a.end_time) - parseH(a.start_time)) * a.required_count, 0);
    const shortageHours = assignments.reduce((s, a) => s + (parseH(a.end_time) - parseH(a.start_time)) * a.shortage, 0);
    const targetDate = sortedTaskRows[0]?.task_date ?? new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    await db.shift_results.clear();
    await db.shift_results.add({
      id: `RESULT-${Date.now()}`,
      period_start: targetDate,
      period_end: targetDate,
      mode: taskModeId,
      summary: { total_assigned: totalAssigned, total_hours: totalHours, shortage_hours: shortageHours },
      assignments,
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 }, pb: 16 }}>
      <Typography variant="h1" sx={{ color: 'primary.main', mb: 6, fontSize: { xs: '32px', md: '48px' } }}>
        新規シフト作成
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <AssignmentIcon sx={{ color: 'primary.light' }} />
          <Typography variant="h3">作業内容設定</Typography>
        </Stack>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <TextField
              label="対象日"
              type="date"
              size="small"
              value={taskTargetDateIso}
              onChange={(e) => {
                setTaskTargetDateIso(e.target.value);
                setReflected(false);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3, maxWidth: 220 }}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              sx={{ mb: 4 }}
            >
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="task-workload-label">作業量</InputLabel>
                <Select
                  labelId="task-workload-label"
                  label="作業量"
                  value={taskModeId}
                  onChange={(e) => handleModeChange(String(e.target.value))}
                >
                  <MenuItem value="">
                    <em style={{ color: '#9e9e9e' }}>選択なし</em>
                  </MenuItem>
                  {(modes ?? []).map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {m.is_custom && (
                          <BookmarkAddIcon sx={{ fontSize: 16, color: 'primary.light', flexShrink: 0 }} />
                        )}
                        <span>{m.name}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<AddBoxIcon />}
                onClick={() => setLargeDialogOpen(true)}
                sx={{
                  color: 'primary.light',
                  borderColor: 'primary.light',
                  alignSelf: { xs: 'stretch', sm: 'flex-end' },
                }}
              >
                大カテゴリ追加
              </Button>
            </Stack>

            {selectedLargeIds.length === 0 && (
              <Paper
                variant="outlined"
                sx={{ p: 6, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}
              >
                <Typography>「大カテゴリ追加」から作業対象のカテゴリを追加してください。</Typography>
              </Paper>
            )}

            <Stack spacing={4}>
              {[...selectedLargeIds]
                .sort((a, b) => {
                  const aIdx = (categories ?? []).findIndex((c) => c.id === a);
                  const bIdx = (categories ?? []).findIndex((c) => c.id === b);
                  return aIdx - bIdx;
                })
                .map((largeId) => {
                const cat = categories?.find((c) => c.id === largeId);
                if (!cat) return null;
                const smalls = taskConfig[largeId] ?? [];
                const remainingSmallIds = cat.sub_categories.filter(
                  (sc) => !smalls.some((s) => s.category_small_id === sc.id)
                );

                return (
                  <Paper
                    key={largeId}
                    elevation={0}
                    sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, mb: 3 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 14, height: 14, bgcolor: cat.color, borderRadius: '4px' }} />
                        <Typography variant="h3" sx={{ color: '#3A3469' }}>
                          {cat.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.5}>
                        <Button
                          startIcon={<AddIcon />}
                          size="small"
                          onClick={() => setSmallDialogForLarge(largeId)}
                          disabled={remainingSmallIds.length === 0}
                          sx={{
                            bgcolor: '#F2E300',
                            color: '#6B6400',
                            borderRadius: 999,
                            px: 2,
                            '&:hover': { bgcolor: '#D7CA00' },
                            '&.Mui-disabled': { bgcolor: '#F0EDED', color: '#9C9A9F' },
                          }}
                        >
                          小カテゴリ追加
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => removeLargeCategory(largeId)}
                          sx={{ color: 'text.secondary' }}
                        >
                          削除
                        </Button>
                      </Stack>
                    </Stack>

                    <Stack spacing={3}>
                      {smalls.length === 0 && (
                        <Typography
                          sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 3 }}
                        >
                          「小カテゴリ追加」から小カテゴリを追加してください。
                        </Typography>
                      )}
                      {smalls.map((small) => {
                        const color = getCategorySmallColor(small.category_small_id);
                        return (
                          <Paper
                            key={small.category_small_id}
                            elevation={0}
                            sx={{
                              p: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderLeft: `4px solid ${color}`,
                              borderRadius: 2,
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, mb: 2 }}
                            >
                              <Typography variant="h4" sx={{ color: '#3A3469' }}>
                                {small.category_small_name}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  startIcon={<MoreTimeIcon />}
                                  onClick={() =>
                                    setSkillDialogState({ largeId, smallId: small.category_small_id })
                                  }
                                  sx={{
                                    bgcolor: '#F2E300',
                                    color: '#6B6400',
                                    borderRadius: 999,
                                    px: 2,
                                    '&:hover': { bgcolor: '#D7CA00' },
                                  }}
                                >
                                  シフト追加
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => removeSmallCategory(largeId, small.category_small_id)}
                                  sx={{ color: 'text.secondary' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>

                            {small.skills.length === 0 ? (
                              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                                「シフト追加」からスキル配置を追加してください。
                              </Typography>
                            ) : (
                              <Grid container spacing={2}>
                                {small.skills.map((sk) => {
                                  const isEditing = editingSkillId === sk.id;
                                  return (
                                    <Grid item xs={12} sm={6} md={4} key={sk.id}>
                                      <Card
                                        sx={{
                                          borderLeft: `4px solid ${color}`,
                                          height: '100%',
                                          position: 'relative',
                                        }}
                                      >
                                        <CardContent>
                                          <Typography
                                            sx={{
                                              fontSize: '16px',
                                              fontWeight: 700,
                                              mb: 1,
                                              color: 'primary.main',
                                            }}
                                          >
                                            {skillMap.get(sk.skill_id) ?? sk.skill_id}
                                          </Typography>
                                          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                            {sk.start_time}〜{sk.end_time}
                                          </Typography>
                                          <Stack
                                            direction="row"
                                            justifyContent="flex-end"
                                            alignItems="center"
                                            sx={{ mb: 1 }}
                                          >
                                            {isEditing ? (
                                              <TextField
                                                type="number"
                                                size="small"
                                                value={editingCount}
                                                onChange={(e) =>
                                                  setEditingCount(Math.max(1, Number(e.target.value)))
                                                }
                                                inputProps={{ min: 1, style: { width: 50, textAlign: 'right' } }}
                                              />
                                            ) : (
                                              <Box
                                                component="span"
                                                sx={{
                                                  bgcolor: '#C6BFFF',
                                                  color: '#180D54',
                                                  px: 1,
                                                  py: 0.25,
                                                  borderRadius: '4px',
                                                  fontSize: '12px',
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {sk.required_count}名
                                              </Box>
                                            )}
                                          </Stack>
                                          <Stack
                                            direction="row"
                                            justifyContent="flex-end"
                                            spacing={0.5}
                                            sx={{ mt: 1.5 }}
                                          >
                                            {isEditing ? (
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => {
                                                  updateSkillCount(
                                                    largeId,
                                                    small.category_small_id,
                                                    sk.id,
                                                    editingCount
                                                  );
                                                  setEditingSkillId(null);
                                                }}
                                              >
                                                <SaveIcon fontSize="small" />
                                              </IconButton>
                                            ) : (
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  setEditingSkillId(sk.id);
                                                  setEditingCount(sk.required_count);
                                                }}
                                                sx={{ color: 'text.secondary' }}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                            )}
                                            <IconButton
                                              size="small"
                                              onClick={() => removeSkill(largeId, small.category_small_id, sk.id)}
                                              sx={{ color: 'text.secondary' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Stack>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={handleReflect}
                disabled={reflected}
                sx={{
                  bgcolor: '#F2E300',
                  color: '#6B6400',
                  '&:hover': { bgcolor: '#D7CA00' },
                  '&.Mui-disabled': { bgcolor: '#F0EDED', color: '#9C9A9F' },
                  px: 4,
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                {reflected ? '反映済み' : '反映'}
              </Button>
            </Box>
          </Box>
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

      <Backdrop
        open={loading}
        sx={{ zIndex: (t) => t.zIndex.modal + 1, color: '#fff', flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ color: '#fff' }}>シフトを作成しています...</Typography>
      </Backdrop>

      <LargeCategoryDialog
        open={largeDialogOpen}
        onClose={() => setLargeDialogOpen(false)}
        items={availableLargeCategories}
        onSelect={addLargeCategory}
      />

      <SmallCategoryDialog
        largeId={smallDialogForLarge}
        categories={categories ?? []}
        existing={taskConfig}
        onClose={() => setSmallDialogForLarge(null)}
        onSelect={addSmallCategory}
      />

      <SkillDialog
        state={skillDialogState}
        skills={skills ?? []}
        onClose={() => setSkillDialogState(null)}
        onSubmit={(largeId, smallId, cfg) => addSkillConfig(largeId, smallId, cfg)}
      />

      <SaveWorkloadDialog
        open={saveDialogOpen}
        value={newWorkloadName}
        onChange={setNewWorkloadName}
        onSave={handleSaveAndReflect}
        onSkip={handleSkipAndReflect}
        onCancel={() => setSaveDialogOpen(false)}
      />

      <ConfirmDialog
        open={reflectConfirmOpen}
        title="反映の確認"
        message="現在の作業内容設定をデータベースに保存します。よろしいですか？"
        confirmLabel="OK"
        cancelLabel="キャンセル"
        onConfirm={handleReflectConfirmed}
        onClose={() => setReflectConfirmOpen(false)}
      />
    </Box>
  );
}

interface LargeDialogProps {
  open: boolean;
  onClose: () => void;
  items: Category[];
  onSelect: (id: string) => void;
}

function LargeCategoryDialog({ open, onClose, items, onSelect }: LargeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>大カテゴリ選択</DialogTitle>
      <DialogContent dividers>
        {items.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            追加可能な大カテゴリはありません。
          </Typography>
        ) : (
          <List>
            {items.map((c) => (
              <ListItemButton key={c.id} onClick={() => onSelect(c.id)}>
                <Box sx={{ width: 14, height: 14, bgcolor: c.color, borderRadius: '4px', mr: 2 }} />
                <ListItemText primary={c.name} secondary={c.id} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

interface SmallDialogProps {
  largeId: string | null;
  categories: Category[];
  existing: TaskConfig;
  onClose: () => void;
  onSelect: (largeId: string, smallId: string, smallName: string) => void;
}

function SmallCategoryDialog({ largeId, categories, existing, onClose, onSelect }: SmallDialogProps) {
  const cat = largeId ? categories.find((c) => c.id === largeId) : null;
  const existingSmall = largeId ? existing[largeId] ?? [] : [];
  const remaining = (cat?.sub_categories ?? []).filter(
    (sc) => !existingSmall.some((s) => s.category_small_id === sc.id)
  );

  return (
    <Dialog open={Boolean(largeId)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>小カテゴリ選択{cat ? ` - ${cat.name}` : ''}</DialogTitle>
      <DialogContent dividers>
        {remaining.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            追加可能な小カテゴリはありません。
          </Typography>
        ) : (
          <List>
            {remaining.map((sc) => (
              <ListItemButton key={sc.id} onClick={() => largeId && onSelect(largeId, sc.id, sc.name)}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    bgcolor: getCategorySmallColor(sc.id),
                    borderRadius: '4px',
                    mr: 2,
                  }}
                />
                <ListItemText primary={sc.name} secondary={sc.id} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

interface SkillDialogProps {
  state: { largeId: string; smallId: string } | null;
  skills: Skill[];
  onClose: () => void;
  onSubmit: (largeId: string, smallId: string, cfg: Omit<SkillConfig, 'id'>) => void;
}

function SkillDialog({ state, skills, onClose, onSubmit }: SkillDialogProps) {
  const [skillId, setSkillId] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (state) {
      setSkillId(skills[0]?.id ?? '');
      setStartTime('09:00');
      setEndTime('17:00');
      setCount(1);
    }
  }, [state, skills]);

  if (!state) return null;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>シフト追加</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>スキル</Typography>
            <Select size="small" fullWidth value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              {skills.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>開始時間</Typography>
              <TextField
                type="time"
                size="small"
                fullWidth
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>終了時間</Typography>
              <TextField
                type="time"
                size="small"
                fullWidth
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Box>
          </Stack>
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>必要人数</Typography>
            <TextField
              type="number"
              size="small"
              fullWidth
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1 }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!skillId}
          onClick={() => {
            const skillLabel = skills.find((s) => s.id === skillId)?.name ?? '';
            onSubmit(state.largeId, state.smallId, {
              skill_id: skillId,
              start_time: startTime,
              end_time: endTime,
              task_name: skillLabel,
              required_count: count,
            });
          }}
        >
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SaveWorkloadDialogProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

function SaveWorkloadDialog({ open, value, onChange, onSave, onSkip, onCancel }: SaveWorkloadDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BookmarkAddIcon sx={{ color: 'primary.main' }} />
        作業量として保存
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: '14px', color: 'text.secondary', mb: 2 }}>
          現在の設定内容を新しい「作業量」として保存できます。
          名前を入力して「保存して反映」を選ぶと、次回からドロップダウンで選択できるようになります。
        </Typography>
        <TextField
          label="作業量の名前"
          size="small"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例: 繁忙期特別、週末シフト など"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSave();
          }}
        />
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<BookmarkAddIcon />}
          onClick={onSave}
          disabled={!value.trim()}
          sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
        >
          保存して反映
        </Button>
        <Button fullWidth onClick={onCancel} sx={{ color: 'text.secondary' }}>
          キャンセル
        </Button>
        <Button fullWidth onClick={onSkip} sx={{ color: 'text.secondary' }}>
          保存せず反映
        </Button>
      </DialogActions>
    </Dialog>
  );
}

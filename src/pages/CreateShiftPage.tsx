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
import { isoDateToSlash, slashDateToIso, todayIsoDate } from '../utils/taskDateTime';
import type { Category, Skill, TaskRow, Mode } from '../types';

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

    if (existingTaskRows && existingTaskRows.length > 0) {
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
      existingTaskRows.forEach((row) => {
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
      const td0 = existingTaskRows[0]?.task_date;
      setTaskTargetDateIso(td0 && td0.includes('/') ? slashDateToIso(td0) : todayIsoDate());
      setHydrated(true);
      return;
    }

    const defaultMode = modes.find((m) => m.id === 'WL-01') ?? modes[0];
    if (defaultMode) {
      setTaskModeId(defaultMode.id);
      const result = buildConfigFromWorkload(defaultMode);
      if (result) {
        setSelectedLargeIds(result.newSelectedLargeIds);
        setTaskConfig(result.newTaskConfig);
      }
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, existingTaskRows, hydrated, modes, skills]);

  const handleModeChange = (modeId: string) => {
    setTaskModeId(modeId);
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
  };

  const removeLargeCategory = (largeId: string) => {
    setSelectedLargeIds((prev) => prev.filter((id) => id !== largeId));
    setTaskConfig((prev) => {
      const next = { ...prev };
      delete next[largeId];
      return next;
    });
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
  };

  const removeSmallCategory = (largeId: string, smallId: string) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).filter((s) => s.category_small_id !== smallId),
    }));
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
  };

  const removeSkill = (largeId: string, smallId: string, skillRowId: string) => {
    setTaskConfig((prev) => ({
      ...prev,
      [largeId]: (prev[largeId] ?? []).map((s) =>
        s.category_small_id === smallId ? { ...s, skills: s.skills.filter((sk) => sk.id !== skillRowId) } : s
      ),
    }));
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
  };

  const handleReflect = () => {
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
              onChange={(e) => setTaskTargetDateIso(e.target.value)}
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
              {selectedLargeIds.map((largeId) => {
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

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleReflect}
                        sx={{
                          bgcolor: '#F2E300',
                          color: '#6B6400',
                          '&:hover': { bgcolor: '#D7CA00' },
                          px: 4,
                          fontWeight: 700,
                          fontSize: '16px',
                        }}
                      >
                        反映
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>

            {selectedLargeIds.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleReflect}
                  sx={{
                    bgcolor: '#F2E300',
                    color: '#6B6400',
                    '&:hover': { bgcolor: '#D7CA00' },
                    px: 4,
                    fontWeight: 700,
                    fontSize: '16px',
                  }}
                >
                  反映
                </Button>
              </Box>
            )}
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
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CheckCircleIcon />}
          onClick={onSkip}
          sx={{ color: '#6B6400', borderColor: '#F2E300', bgcolor: '#FFFDE7' }}
        >
          保存せずに反映
        </Button>
        <Button fullWidth onClick={onCancel} sx={{ color: 'text.secondary' }}>
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
}

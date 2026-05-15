import { Fragment, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Stack,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { db } from '../../db/database';
import type { Category, SubCategory } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export default function CategoryManager() {
  const categories = (useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined) ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ mode: 'add' | 'edit'; data: Category } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [subEditing, setSubEditing] = useState<{
    largeId: string;
    mode: 'add' | 'edit';
    data: SubCategory;
  } | null>(null);
  const [subDeleting, setSubDeleting] = useState<{ largeId: string; sub: SubCategory } | null>(null);

  const handleSave = async (data: Category) => {
    if (!editing) return;
    if (editing.mode === 'add') {
      await db.categories.add(data);
    } else {
      await db.categories.put(data);
    }
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await db.categories.delete(deleting.id);
  };

  const handleSubSave = async (data: SubCategory) => {
    if (!subEditing) return;
    const cat = categories.find((c) => c.id === subEditing.largeId);
    if (!cat) return;
    const list = subEditing.mode === 'add'
      ? [...cat.sub_categories, data]
      : cat.sub_categories.map((s) => (s.id === data.id ? data : s));
    await db.categories.update(cat.id, { sub_categories: list });
    setSubEditing(null);
  };

  const handleSubDelete = async () => {
    if (!subDeleting) return;
    const cat = categories.find((c) => c.id === subDeleting.largeId);
    if (!cat) return;
    await db.categories.update(cat.id, {
      sub_categories: cat.sub_categories.filter((s) => s.id !== subDeleting.sub.id),
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">カテゴリ一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            setEditing({
              mode: 'add',
              data: { id: uid('CAT'), name: '', color: '#3B82F6', sub_categories: [] },
            })
          }
        >
          カテゴリ大 追加
        </Button>
      </Stack>

      <Paper sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F6F3F2' }}>
              <TableCell />
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>名称</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>色</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>カテゴリ小</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => {
              const open = expanded === cat.id;
              return (
                <Fragment key={cat.id}>
                  <TableRow hover>
                    <TableCell sx={{ width: 40 }}>
                      <IconButton size="small" onClick={() => setExpanded(open ? null : cat.id)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{cat.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '4px', bgcolor: cat.color, border: '1px solid #E0E0E0' }} />
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{cat.color}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{cat.sub_categories.length}件</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => setEditing({ mode: 'edit', data: { ...cat } })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleting(cat)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0, borderBottom: open ? undefined : 'none' }}>
                      <Collapse in={open} unmountOnExit>
                        <Box sx={{ p: 3, bgcolor: '#FAFAFA' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>カテゴリ小</Typography>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                setSubEditing({
                                  largeId: cat.id,
                                  mode: 'add',
                                  data: { id: uid(`${cat.id}-SUB`), name: '' },
                                })
                              }
                            >
                              追加
                            </Button>
                          </Stack>
                          <List dense disablePadding>
                            {cat.sub_categories.length === 0 && (
                              <Typography sx={{ color: 'text.secondary', py: 1 }}>カテゴリ小がありません。</Typography>
                            )}
                            {cat.sub_categories.map((sc) => (
                              <ListItem
                                key={sc.id}
                                sx={{ borderBottom: '1px dashed #E0E0E0' }}
                                secondaryAction={
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setSubEditing({ largeId: cat.id, mode: 'edit', data: { ...sc } })
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setSubDeleting({ largeId: cat.id, sub: sc })}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                }
                              >
                                <ListItemText
                                  primary={sc.name}
                                  secondary={sc.id}
                                  primaryTypographyProps={{ fontWeight: 500 }}
                                  secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <CategoryDialog editing={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      <SubCategoryDialog editing={subEditing} onClose={() => setSubEditing(null)} onSave={handleSubSave} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="カテゴリ大の削除"
        message={`「${deleting?.name}」を削除します。配下のカテゴリ小も全て削除されます。よろしいですか？`}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={Boolean(subDeleting)}
        title="カテゴリ小の削除"
        message={`「${subDeleting?.sub.name}」を削除します。よろしいですか？`}
        onClose={() => setSubDeleting(null)}
        onConfirm={handleSubDelete}
      />
    </Box>
  );
}

interface CategoryDialogProps {
  editing: { mode: 'add' | 'edit'; data: Category } | null;
  onClose: () => void;
  onSave: (data: Category) => void;
}

function CategoryDialog({ editing, onClose, onSave }: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    if (editing) {
      setName(editing.data.name);
      setColor(editing.data.color);
    }
  }, [editing]);

  if (!editing) return null;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>カテゴリ大 {editing.mode === 'add' ? '追加' : '編集'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField label="名称" size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>色</Typography>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 48, height: 36, border: 'none', cursor: 'pointer' }}
            />
            <TextField size="small" value={color} onChange={(e) => setColor(e.target.value)} sx={{ width: 140 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onSave({ ...editing.data, name: name.trim(), color })}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SubCategoryDialogProps {
  editing: { largeId: string; mode: 'add' | 'edit'; data: SubCategory } | null;
  onClose: () => void;
  onSave: (data: SubCategory) => void;
}

function SubCategoryDialog({ editing, onClose, onSave }: SubCategoryDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (editing) setName(editing.data.name);
  }, [editing]);

  if (!editing) return null;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>カテゴリ小 {editing.mode === 'add' ? '追加' : '編集'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="名称"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onSave({ ...editing.data, name: name.trim() })}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

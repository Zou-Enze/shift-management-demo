import { useEffect, useState } from 'react';
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
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { db } from '../../db/database';
import type { Skill, Employee } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';

function uid(): string {
  return `SKL-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default function SkillManager() {
  const skills = (useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined) ?? [];
  const employees = (useLiveQuery(() => db.employees.toArray(), []) as Employee[] | undefined) ?? [];

  const [editing, setEditing] = useState<{ mode: 'add' | 'edit'; data: Skill } | null>(null);
  const [deleting, setDeleting] = useState<Skill | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const handleSave = async (data: Skill) => {
    if (!editing) return;
    if (editing.mode === 'add') await db.skills.add(data);
    else await db.skills.put(data);
    setEditing(null);
  };

  const tryDelete = (sk: Skill) => {
    const used = employees.filter((e) => e.skills.includes(sk.id)).length;
    if (used > 0) {
      setBlockedReason(`このスキルは${used}名の要員に使用されています。`);
      return;
    }
    setDeleting(sk);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await db.skills.delete(deleting.id);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">スキル一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing({ mode: 'add', data: { id: uid(), name: '' } })}
        >
          スキル追加
        </Button>
      </Stack>

      <Paper sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F6F3F2' }}>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>名称</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skills.map((sk) => (
              <TableRow key={sk.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{sk.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{sk.name}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => setEditing({ mode: 'edit', data: { ...sk } })}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => tryDelete(sk)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <SkillDialog editing={editing} onClose={() => setEditing(null)} onSave={handleSave} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="スキルの削除"
        message={`「${deleting?.name}」を削除します。よろしいですか？`}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <Dialog open={Boolean(blockedReason)} onClose={() => setBlockedReason(null)} maxWidth="xs" fullWidth>
        <DialogTitle>削除できません</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">{blockedReason}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockedReason(null)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface DialogProps {
  editing: { mode: 'add' | 'edit'; data: Skill } | null;
  onClose: () => void;
  onSave: (data: Skill) => void;
}

function SkillDialog({ editing, onClose, onSave }: DialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (editing) setName(editing.data.name);
  }, [editing]);

  if (!editing) return null;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>スキル {editing.mode === 'add' ? '追加' : '編集'}</DialogTitle>
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
        <Button variant="contained" disabled={!name.trim()} onClick={() => onSave({ ...editing.data, name: name.trim() })}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

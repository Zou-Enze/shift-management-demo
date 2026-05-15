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
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { db } from '../../db/database';
import type { Employee, Skill } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';

function uid(): string {
  return `EMP-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default function EmployeeManager() {
  const employees = (useLiveQuery(() => db.employees.toArray(), []) as Employee[] | undefined) ?? [];
  const skills = (useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined) ?? [];

  const [editing, setEditing] = useState<{ mode: 'add' | 'edit'; data: Employee } | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const handleSave = async (data: Employee) => {
    if (!editing) return;
    if (editing.mode === 'add') await db.employees.add(data);
    else await db.employees.put(data);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await db.employees.delete(deleting.id);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">要員一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing({ mode: 'add', data: { id: uid(), name: '', skills: [] } })}
        >
          要員追加
        </Button>
      </Stack>

      <Paper sx={{ border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F6F3F2' }}>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>姓名</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>保有スキル</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{emp.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {emp.skills.length === 0 ? (
                      <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>—</Typography>
                    ) : (
                      emp.skills.map((sid) => {
                        const s = skills.find((x) => x.id === sid);
                        return <Chip key={sid} label={s?.name ?? sid} size="small" />;
                      })
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => setEditing({ mode: 'edit', data: { ...emp } })}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleting(emp)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <EmployeeDialog editing={editing} skills={skills} onClose={() => setEditing(null)} onSave={handleSave} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="要員の削除"
        message={`「${deleting?.name}」を削除します。よろしいですか？`}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}

interface EmpDialogProps {
  editing: { mode: 'add' | 'edit'; data: Employee } | null;
  skills: Skill[];
  onClose: () => void;
  onSave: (data: Employee) => void;
}

function EmployeeDialog({ editing, skills, onClose, onSave }: EmpDialogProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (editing) {
      setName(editing.data.name);
      setSelected(editing.data.skills);
    }
  }, [editing]);

  if (!editing) return null;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>要員 {editing.mode === 'add' ? '追加' : '編集'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField label="姓名" size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>スキル</Typography>
            <FormGroup>
              {skills.map((s) => (
                <FormControlLabel
                  key={s.id}
                  control={<Checkbox checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />}
                  label={s.name}
                />
              ))}
            </FormGroup>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onSave({ ...editing.data, name: name.trim(), skills: selected })}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

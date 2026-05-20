import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Stack,
  Typography,
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
  TextField,
  Tooltip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { db } from '../db/database';
import type { Employee, ShiftRequest } from '../types';

const MINUTE_OPTIONS = ['00', '15', '30', '45'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// "yyyy/mm/dd" -> "yyyy-mm-dd" for date input
function toInputDate(date: string): string {
  return date.replace(/\//g, '-');
}

// "yyyy-mm-dd" -> "yyyy/mm/dd" for storage
function toStorageDate(date: string): string {
  return date.replace(/-/g, '/');
}

function parseTime(time: string): { hour: string; minute: string } {
  const [h = '09', m = '00'] = time.split(':');
  return { hour: h, minute: m };
}

function snapMinute(m: string): string {
  const n = parseInt(m, 10);
  const snapped = Math.round(n / 15) * 15;
  return String(snapped >= 60 ? 0 : snapped).padStart(2, '0');
}

interface LocalEdit {
  date?: string;
  preferred_start?: string;
  preferred_end?: string;
}

export default function ShiftRequestPage() {
  const employees = useLiveQuery(() => db.employees.toArray(), []) as Employee[] | undefined;
  const requests = useLiveQuery(() => db.shift_requests.toArray(), []) as ShiftRequest[] | undefined;

  const [targetDate] = useState<string>(today());
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});

  const setEdit = (id: string, changes: LocalEdit) => {
    setLocalEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));
  };

  const getField = <K extends keyof ShiftRequest>(req: ShiftRequest, key: K): ShiftRequest[K] => {
    const edit = localEdits[req.id] as Partial<ShiftRequest> | undefined;
    return (edit?.[key] ?? req[key]) as ShiftRequest[K];
  };

  const handleSaveRequest = async (id: string) => {
    const edits = localEdits[id];
    if (!edits || Object.keys(edits).length === 0) return;
    await db.shift_requests.update(id, edits);
    setLocalEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

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

  const handleRemoveRequest = async (id: string) => {
    setLocalEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await db.shift_requests.delete(id);
  };

  const TimeSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => {
    const { hour, minute } = parseTime(value);
    const snappedMinute = snapMinute(minute);
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Select
          size="small"
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${snappedMinute}`)}
          sx={{ minWidth: 64 }}
        >
          {HOUR_OPTIONS.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </Select>
        <Typography>:</Typography>
        <Select
          size="small"
          value={snappedMinute}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
          sx={{ minWidth: 64 }}
        >
          {MINUTE_OPTIONS.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 } }}>
      <Typography variant="h1" sx={{ color: 'primary.main', mb: 6, fontSize: { xs: '32px', md: '48px' } }}>
        シフト希望入力
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <GroupsIcon sx={{ color: 'primary.light' }} />
          <Typography variant="h3">シフト希望表入力</Typography>
        </Stack>

        <Paper
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          elevation={0}
        >
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
              {(requests ?? []).map((req) => {
                const hasEdits = !!localEdits[req.id] && Object.keys(localEdits[req.id]).length > 0;
                return (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={toInputDate(getField(req, 'date'))}
                        onChange={(e) => setEdit(req.id, { date: toStorageDate(e.target.value) })}
                        sx={{ width: 155 }}
                        inputProps={{ style: { cursor: 'pointer' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ px: 1 }}>
                        {req.employee_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{req.employee_name}</TableCell>
                    <TableCell>
                      <TimeSelect
                        value={getField(req, 'preferred_start')}
                        onChange={(val) => setEdit(req.id, { preferred_start: val })}
                      />
                    </TableCell>
                    <TableCell>
                      <TimeSelect
                        value={getField(req, 'preferred_end')}
                        onChange={(val) => setEdit(req.id, { preferred_end: val })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="保存">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleSaveRequest(req.id)}
                            disabled={!hasEdits}
                            sx={{
                              color: hasEdits ? 'primary.main' : 'action.disabled',
                              mr: 0.5,
                            }}
                          >
                            <SaveOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton color="error" size="small" onClick={() => handleRemoveRequest(req.id)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </Box>
  );
}

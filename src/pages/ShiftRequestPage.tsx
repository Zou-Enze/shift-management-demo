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
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { db } from '../db/database';
import type { Employee, ShiftRequest } from '../types';

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ShiftRequestPage() {
  const employees = useLiveQuery(() => db.employees.toArray(), []) as Employee[] | undefined;
  const requests = useLiveQuery(() => db.shift_requests.toArray(), []) as ShiftRequest[] | undefined;

  const [targetDate] = useState<string>(today());

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
    </Box>
  );
}

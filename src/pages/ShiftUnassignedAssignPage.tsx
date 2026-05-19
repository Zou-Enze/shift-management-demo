import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { AdjustRow } from './shiftAdjust/adjustTypes';

interface LocationState {
  rows: AdjustRow[];
  date: string;
}

function extractTime(dt: string): string {
  const parts = dt.trim().split(' ');
  return parts[1] ?? parts[0] ?? '';
}

const BD = '1px solid #E0E0E0';

const TH_SX = {
  fontWeight: 600,
  fontSize: '13px',
  fontFamily: 'Hanken Grotesk, sans-serif',
  bgcolor: '#F6F3F2',
  borderRight: BD,
  whiteSpace: 'nowrap' as const,
  py: '10px',
  px: '14px',
};

const TD_SX = {
  fontSize: '13px',
  fontFamily: 'Hanken Grotesk, sans-serif',
  borderRight: BD,
  verticalAlign: 'top',
  py: '10px',
  px: '14px',
};

export default function ShiftUnassignedAssignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const date = state?.date ?? '';
  const allRows = state?.rows ?? [];

  const employees = useLiveQuery(() => db.employees.toArray(), []);

  const unassignedRows = useMemo(
    () =>
      allRows.filter(
        (row) => row.assignedEmployees.length < row.requiredCount || row.absentEmployees.length > 0
      ),
    [allRows]
  );

  const [selectedMap, setSelectedMap] = useState<Record<string, Set<string>>>({});

  const getAvailableEmployees = (skill: string) =>
    (employees ?? []).filter((e) => e.skills.includes(skill));

  const toggleEmployee = (rowId: string, empId: string) => {
    setSelectedMap((prev) => {
      const current = new Set(prev[rowId] ?? []);
      if (current.has(empId)) {
        current.delete(empId);
      } else {
        current.add(empId);
      }
      return { ...prev, [rowId]: current };
    });
  };

  if (!state?.rows) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}>
        <Typography color="text.secondary">
          データがありません。先に変更箇所入力ページからアクセスしてください。
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/shift/adjust/edit')}
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
      <Stack direction="row" alignItems="center" sx={{ mb: 4 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'text.secondary' }}
        >
          戻る
        </Button>
      </Stack>

      <Typography
        variant="h3"
        sx={{
          color: 'primary.main',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          mb: 2,
        }}
      >
        未割当分アサイン
      </Typography>

      {date && (
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'Montserrat, sans-serif', mb: 3 }}
        >
          {date}
        </Typography>
      )}

      {unassignedRows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: BD,
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary" sx={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            未割当・欠席の作業はありません。
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: BD,
            borderRadius: 1,
            boxShadow: '0px 10px 30px rgba(82, 75, 144, 0.08)',
          }}
        >
          <Table sx={{ tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={TH_SX}>大分類</TableCell>
                <TableCell sx={TH_SX}>小分類</TableCell>
                <TableCell sx={TH_SX}>作業</TableCell>
                <TableCell sx={TH_SX}>開始時間</TableCell>
                <TableCell sx={TH_SX}>終了時間</TableCell>
                <TableCell sx={{ ...TH_SX, borderRight: 'none' }}>割当可能作業員</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unassignedRows.map((row) => {
                const availableEmps = getAvailableEmployees(row.skill);
                const selected = selectedMap[row.id] ?? new Set<string>();
                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      '&:last-child td': { borderBottom: 'none' },
                      '&:hover': { bgcolor: '#FAFAFA' },
                    }}
                  >
                    <TableCell sx={TD_SX}>{row.categoryLarge}</TableCell>
                    <TableCell sx={TD_SX}>{row.categorySmall}</TableCell>
                    <TableCell sx={TD_SX}>{row.skill}</TableCell>
                    <TableCell sx={TD_SX}>{extractTime(row.startDateTime)}</TableCell>
                    <TableCell sx={TD_SX}>{extractTime(row.endDateTime)}</TableCell>
                    <TableCell sx={{ ...TD_SX, borderRight: 'none' }}>
                      {availableEmps.length === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                        >
                          該当スキル保有者なし
                        </Typography>
                      ) : (
                        <Stack spacing={0.25}>
                          {availableEmps.map((emp) => (
                            <FormControlLabel
                              key={emp.id}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={selected.has(emp.id)}
                                  onChange={() => toggleEmployee(row.id, emp.id)}
                                  sx={{
                                    color: '#C9C4D2',
                                    '&.Mui-checked': { color: 'primary.main' },
                                    p: '2px 6px 2px 2px',
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  variant="body2"
                                  sx={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px' }}
                                >
                                  {emp.name}
                                </Typography>
                              }
                              sx={{ m: 0, alignItems: 'center' }}
                            />
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            fontWeight: 700,
            fontFamily: 'Hanken Grotesk, sans-serif',
            borderRadius: '4px',
            px: 4,
            '&:hover': { bgcolor: '#3b3377' },
          }}
        >
          確定
        </Button>
      </Stack>
    </Box>
  );
}

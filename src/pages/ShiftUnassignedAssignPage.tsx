import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
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
import type { Assignment, AssignedEmployee, Category, ShiftRequest, Skill } from '../types';
import type { AdjustRow } from './shiftAdjust/adjustTypes';

interface LocationState {
  rows: AdjustRow[];
  date: string;
}

function extractTime(dt: string): string {
  const parts = dt.trim().split(' ');
  return parts[1] ?? parts[0] ?? '';
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
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
  const skills = useLiveQuery(() => db.skills.toArray(), []) as Skill[] | undefined;
  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  useEffect(() => {
    fetch('/data/shift_requests.json')
      .then((r) => r.json())
      .then((data: { shift_requests: ShiftRequest[] }) => setShiftRequests(data.shift_requests))
      .catch(() => setShiftRequests([]));
  }, []);

  const unassignedRows = useMemo(
    () =>
      allRows.filter(
        (row) => row.assignedEmployees.length < row.requiredCount || row.absentEmployees.length > 0
      ),
    [allRows]
  );

  const [selectedMap, setSelectedMap] = useState<Record<string, string>>({});

  const getAvailableEmployees = (skillName: string, startTime: string, endTime: string) => {
    const skillId = (skills ?? []).find((s) => s.name === skillName)?.id;
    const taskStart = toMinutes(startTime);
    const taskEnd = toMinutes(endTime);
    const availableEmpIds = new Set(
      shiftRequests
        .filter(
          (req) =>
            req.date === date &&
            toMinutes(req.preferred_start) === taskStart &&
            toMinutes(req.preferred_end) === taskEnd
        )
        .map((req) => req.employee_id)
    );
    return (employees ?? []).filter(
      (e) => skillId !== undefined && e.skills.includes(skillId) && availableEmpIds.has(e.id)
    );
  };

  const selectEmployee = (rowId: string, empId: string) => {
    setSelectedMap((prev) => ({ ...prev, [rowId]: empId }));
  };

  const handleConfirm = async () => {
    if (!categories || !skills || !employees) return;

    const unassignedRowIds = new Set(unassignedRows.map((r) => r.id));

    const assignments: Assignment[] = allRows.map((row) => {
      const cat = categories.find((c) => c.name === row.categoryLarge);
      const subCat = cat?.sub_categories.find((sc) => sc.name === row.categorySmall);
      const skillObj = skills.find((s) => s.name === row.skill);

      const absentIds = new Set(row.absentEmployees.map((e) => e.id));
      const finalEmployees: AssignedEmployee[] = row.assignedEmployees
        .filter((e) => !absentIds.has(e.id))
        .map((e) => ({ employee_id: e.id, employee_name: e.name }));

      if (unassignedRowIds.has(row.id)) {
        const startTime = extractTime(row.startDateTime);
        const endTime = extractTime(row.endDateTime);
        const availableEmps = getAvailableEmployees(row.skill, startTime, endTime);
        const selectedEmpId = selectedMap[row.id];

        if (selectedEmpId) {
          const emp = employees.find((e) => e.id === selectedEmpId);
          if (emp) finalEmployees.push({ employee_id: emp.id, employee_name: emp.name });
        } else if (availableEmps.length === 1) {
          finalEmployees.push({ employee_id: availableEmps[0].id, employee_name: availableEmps[0].name });
        }
      }

      const startTime = extractTime(row.startDateTime);
      const endTime = extractTime(row.endDateTime);

      return {
        task_id: row.id,
        category_large_id: cat?.id ?? row.categoryLarge,
        category_large: row.categoryLarge,
        category_small_id: subCat?.id ?? row.categorySmall,
        category_small: row.categorySmall,
        start_time: startTime,
        end_time: endTime,
        task_name: row.skill,
        skill_id: skillObj?.id ?? row.skill,
        skill: row.skill,
        required_count: row.requiredCount,
        assigned_count: finalEmployees.length,
        shortage: Math.max(0, row.requiredCount - finalEmployees.length),
        assigned_employees: finalEmployees,
      };
    });

    const summary = {
      id: `das-${date}-${Date.now()}`,
      date,
      assignments,
    };
    await db.daily_adjust_summaries.put(summary);

    navigate('/shift/adjust/summary', { state: { date } });
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
                const startTime = extractTime(row.startDateTime);
                const endTime = extractTime(row.endDateTime);
                const availableEmps = getAvailableEmployees(row.skill, startTime, endTime);
                const selectedEmpId = selectedMap[row.id] ?? '';
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
                    <TableCell sx={TD_SX}>{startTime}</TableCell>
                    <TableCell sx={TD_SX}>{endTime}</TableCell>
                    <TableCell sx={{ ...TD_SX, borderRight: 'none' }}>
                      {availableEmps.length === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                        >
                          割当可能作業員なし
                        </Typography>
                      ) : availableEmps.length === 1 ? (
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px' }}
                        >
                          {availableEmps[0].name}
                        </Typography>
                      ) : (
                        <RadioGroup
                          value={selectedEmpId}
                          onChange={(e) => selectEmployee(row.id, e.target.value)}
                        >
                          {availableEmps.map((emp) => (
                            <FormControlLabel
                              key={emp.id}
                              value={emp.id}
                              control={
                                <Radio
                                  size="small"
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
                        </RadioGroup>
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
          onClick={handleConfirm}
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
          シフト管理表再編
        </Button>
      </Stack>
    </Box>
  );
}

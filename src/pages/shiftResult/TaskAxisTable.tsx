import { Fragment, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Assignment, Category } from '../../types';
import { getCategorySmallColor } from '../../constants/categoryColors';

interface Props {
  assignments: Assignment[];
  categories: Category[];
}

export default function TaskAxisTable({ assignments, categories }: Props) {
  const grouped = useMemo(() => {
    const m = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      const list = m.get(a.category_large_id) ?? [];
      list.push(a);
      m.set(a.category_large_id, list);
    });
    return m;
  }, [assignments]);

  return (
    <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }} elevation={0}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F6F3F2', borderBottom: '1px solid', borderColor: 'divider' }}>
            {[
              'カテゴリ大',
              'カテゴリ小',
              '開始時間',
              '終了時間',
              '作業内容',
              'スキル',
              '必要人数',
              '割当要員',
            ].map((h) => (
              <TableCell
                key={h}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(grouped.entries()).map(([largeId, list]) => {
            const cat = categories.find((c) => c.id === largeId);
            return (
              <Fragment key={largeId}>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    sx={{
                      bgcolor: cat?.color ?? '#888888',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    {cat?.name ?? largeId}
                  </TableCell>
                </TableRow>
                {list.map((a) => {
                  const hasShortage = a.shortage > 0;
                  return (
                    <TableRow
                      key={a.task_id}
                      hover
                      sx={hasShortage ? { bgcolor: 'error.light' } : undefined}
                    >
                      <TableCell>{a.category_large}</TableCell>
                      <TableCell
                        sx={{
                          borderLeft: `4px solid ${getCategorySmallColor(a.category_small_id)}`,
                          pl: 2,
                        }}
                      >
                        {a.category_small}
                      </TableCell>
                      <TableCell>{a.start_time}</TableCell>
                      <TableCell>{a.end_time}</TableCell>
                      <TableCell>{a.task_name}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box
                          component="span"
                          sx={{
                            bgcolor: '#E4E2E1',
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.skill}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack component="span" spacing={0.25} alignItems="flex-start" sx={{ display: 'inline-flex' }}>
                          <Typography component="span" sx={{ fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.35 }}>
                            {a.assigned_count}/{a.required_count}名
                          </Typography>
                          {hasShortage && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '12px',
                                color: 'error.dark',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                lineHeight: 1.35,
                              }}
                            >
                              不足{a.shortage}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>
                        {a.assigned_employees.map((e) => `${e.employee_id} ${e.employee_name}`).join(', ')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}

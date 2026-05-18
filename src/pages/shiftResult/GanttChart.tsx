import { Fragment, useMemo } from 'react';
import { Box, Paper, Tooltip, Typography } from '@mui/material';
import type { Assignment, Category } from '../../types';

interface Props {
  assignments: Assignment[];
  categories: Category[];
}

/** 0:00〜24:00、見出しは 0〜23 時 */
const RANGE_START = 0;
const RANGE_TOTAL = 24;

const NAME_COL_WIDTH = 160;

function parseHour(time: string): number {
  const [hh, mm] = time.split(':').map(Number);
  return hh + (Number.isFinite(mm) ? mm / 60 : 0);
}

interface EmployeeRow {
  employee_id: string;
  employee_name: string;
  bars: Array<Assignment & { startH: number; endH: number }>;
}

export default function GanttChart({ assignments, categories }: Props) {
  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.color));
    return m;
  }, [categories]);

  const rows = useMemo<EmployeeRow[]>(() => {
    const map = new Map<string, EmployeeRow>();
    assignments.forEach((a) => {
      const startH = parseHour(a.start_time);
      const endH = parseHour(a.end_time);
      a.assigned_employees.forEach((emp) => {
        if (!map.has(emp.employee_id)) {
          map.set(emp.employee_id, {
            employee_id: emp.employee_id,
            employee_name: emp.employee_name,
            bars: [],
          });
        }
        map.get(emp.employee_id)!.bars.push({ ...a, startH, endH });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.employee_id.localeCompare(b.employee_id));
  }, [assignments]);

  const hourIndexes = Array.from({ length: RANGE_TOTAL }, (_, i) => i);

  /** 名称列 + 24 等分（ヘッダーとデータ行で同一テンプレート） */
  const gridTemplateColumns = `minmax(${NAME_COL_WIDTH}px, ${NAME_COL_WIDTH}px) repeat(24, minmax(28px, 1fr))`;

  const borderDivider = '1px solid #E0E0E0';

  return (
    <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }} elevation={0}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            minWidth: NAME_COL_WIDTH + 24 * 36,
          }}
        >
          {/* ヘッダー行 */}
          <Box
            sx={{
              gridColumn: 1,
              gridRow: 1,
              p: 2,
              fontWeight: 600,
              fontSize: '14px',
              bgcolor: '#F6F3F2',
              borderBottom: borderDivider,
              borderRight: borderDivider,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            要員 / 時間
          </Box>
          {hourIndexes.map((h, i) => (
            <Box
              key={h}
              sx={{
                gridColumn: i + 2,
                gridRow: 1,
                py: 2,
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 500,
                bgcolor: '#F6F3F2',
                borderBottom: borderDivider,
                borderRight: i === hourIndexes.length - 1 ? 'none' : borderDivider,
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              {h}時
            </Box>
          ))}

          {/* データ行 */}
          {rows.length === 0 ? (
            <Box
              sx={{
                gridColumn: '1 / -1',
                gridRow: 2,
                py: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              割当データがありません。
            </Box>
          ) : (
            rows.map((row, ri) => (
              <Fragment key={row.employee_id}>
                <Box
                  sx={{
                    gridColumn: 1,
                    gridRow: ri + 2,
                    p: 2,
                    borderBottom: borderDivider,
                    borderRight: borderDivider,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '14px' }}>{row.employee_name}</Typography>
                </Box>
                <Box
                  sx={{
                    gridColumn: '2 / -1',
                    gridRow: ri + 2,
                    position: 'relative',
                    minHeight: 56,
                    bgcolor: '#FFFFFF',
                    borderBottom: borderDivider,
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}
                >
                  {/* 24 区画の縦線（グラデーションではなくグリッドでヘッダーと一致） */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(24, 1fr)',
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    {hourIndexes.map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          borderRight: i < hourIndexes.length - 1 ? borderDivider : 'none',
                          boxSizing: 'border-box',
                          minWidth: 0,
                        }}
                      />
                    ))}
                  </Box>
                  {row.bars.map((bar, idx) => {
                    const clampedStart = Math.max(RANGE_START, Math.min(RANGE_TOTAL, bar.startH));
                    const clampedEnd = Math.max(RANGE_START, Math.min(RANGE_TOTAL, bar.endH));
                    if (clampedEnd <= clampedStart) return null;
                    const left = `${((clampedStart - RANGE_START) / RANGE_TOTAL) * 100}%`;
                    const width = `${((clampedEnd - clampedStart) / RANGE_TOTAL) * 100}%`;
                    const color = colorMap.get(bar.category_large_id) ?? '#888888';
                    return (
                      <Tooltip
                        key={`${bar.task_id}-${idx}`}
                        title={`${bar.task_name} ${bar.start_time}〜${bar.end_time}`}
                        arrow
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            bottom: 8,
                            left,
                            width,
                            bgcolor: color,
                            color: '#FFFFFF',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            px: 0.5,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            opacity: 0.9,
                            '&:hover': { opacity: 1 },
                          }}
                        >
                          {bar.category_small}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Fragment>
            ))
          )}
        </Box>
      </Box>
    </Paper>
  );
}

import { Fragment, useMemo } from 'react';
import { Box, Button, Paper } from '@mui/material';
import type { AdjustRow } from './adjustTypes';

interface EmpBlock {
  employeeId: string;
  employeeName: string;
  startH: number;
  endH: number;
  isAbsent: boolean;
}

interface SpanBar {
  type: 'employee' | 'absent' | 'unassigned';
  startH: number;
  endH: number;
  label: string;
}

function parseHourFromDateTime(dt: string): number {
  const parts = dt.trim().split(' ');
  const timePart = parts[1] ?? '0:00';
  const [h, m] = timePart.split(':').map(Number);
  return h + (isFinite(m) ? m / 60 : 0);
}

function packRows(blocks: EmpBlock[], rowCount: number): EmpBlock[][] {
  const rows: EmpBlock[][] = Array.from({ length: rowCount }, () => []);
  [...blocks].sort((a, b) => a.startH - b.startH).forEach((block) => {
    for (let r = 0; r < rowCount; r++) {
      const last = rows[r][rows[r].length - 1];
      if (!last || last.endH <= block.startH) {
        rows[r].push(block);
        break;
      }
    }
  });
  return rows;
}

function buildBars(blocks: EmpBlock[], taskStart: number, taskEnd: number): SpanBar[] {
  type Slot = {
    type: 'employee' | 'absent' | 'unassigned' | 'empty';
    id: string;
    name: string;
    isAbsent: boolean;
  };
  const slots: Slot[] = Array.from({ length: 24 }, (_, h) => ({
    type: h >= taskStart && h < taskEnd ? 'unassigned' : 'empty',
    id: '',
    name: '',
    isAbsent: false,
  }));

  for (const b of blocks) {
    for (let h = Math.floor(b.startH); h < b.endH && h < 24; h++) {
      if (h >= taskStart && h < taskEnd) {
        slots[h] = {
          type: b.isAbsent ? 'absent' : 'employee',
          id: b.employeeId,
          name: b.employeeName,
          isAbsent: b.isAbsent,
        };
      }
    }
  }

  const bars: SpanBar[] = [];
  let i = 0;
  while (i < 24) {
    const cur = slots[i];
    if (cur.type === 'empty') { i++; continue; }
    let j = i + 1;
    if (cur.type === 'employee') {
      while (j < 24 && slots[j].type === 'employee' && slots[j].id === cur.id) j++;
      bars.push({ type: 'employee', startH: i, endH: j, label: cur.name });
    } else if (cur.type === 'absent') {
      while (j < 24 && slots[j].type === 'absent' && slots[j].id === cur.id) j++;
      bars.push({ type: 'absent', startH: i, endH: j, label: `${cur.name}(欠席)` });
    } else {
      while (j < 24 && slots[j].type === 'unassigned') j++;
      bars.push({ type: 'unassigned', startH: i, endH: j, label: '未割当' });
    }
    i = j;
  }
  return bars;
}

const CATEGORY_LARGE_COLORS: Record<string, string> = {
  '低温': '#4B8CC8',
  '常温': '#E8941A',
  '輸送': '#6B7280',
};

function getCategoryColor(name: string): string {
  return CATEGORY_LARGE_COLORS[name] ?? '#888888';
}

const LABEL1_WIDTH = 100;
const LABEL2_WIDTH = 100;
const CHANGE_COL_WIDTH = 80;
const BD = '1px solid #E0E0E0';
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const RANGE_TOTAL = 24;

interface Props {
  rows: AdjustRow[];
  onRowChange?: (row: AdjustRow) => void;
}

export default function AdjustTable({ rows, onRowChange }: Props) {
  const showChangeCol = !!onRowChange;

  const grouped = useMemo(() => {
    const m = new Map<string, AdjustRow[]>();
    rows.forEach((r) => {
      const list = m.get(r.categoryLarge) ?? [];
      list.push(r);
      m.set(r.categoryLarge, list);
    });
    return m;
  }, [rows]);

  const sortedEntries = useMemo(() => Array.from(grouped.entries()), [grouped]);

  const layoutData = useMemo(() => {
    let currentRow = 2;
    return sortedEntries.map(([categoryLarge, taskList]) => {
      const color = getCategoryColor(categoryLarge);
      const headerRow = currentRow++;

      const taskLayouts = taskList.map((task) => {
        const taskStart = Math.floor(parseHourFromDateTime(task.startDateTime));
        const taskEnd = Math.ceil(parseHourFromDateTime(task.endDateTime));
        const rowCount = Math.max(1, task.requiredCount);
        const startRow = currentRow;
        currentRow += rowCount;

        const blocks: EmpBlock[] = task.assignedEmployees.map((e) => ({
          employeeId: e.id,
          employeeName: e.name,
          startH: taskStart,
          endH: taskEnd,
          isAbsent: task.absentEmployees.some((a) => a.id === e.id),
        }));

        const packedRows = packRows(blocks, rowCount);
        return { task, taskStart, taskEnd, rowCount, startRow, packedRows, color };
      });

      return { categoryLarge, color, headerRow, taskLayouts };
    });
  }, [sortedEntries]);

  const gridTemplateColumns = showChangeCol
    ? `minmax(${LABEL1_WIDTH}px, ${LABEL1_WIDTH}px) minmax(${LABEL2_WIDTH}px, ${LABEL2_WIDTH}px) repeat(24, minmax(28px, 1fr)) minmax(${CHANGE_COL_WIDTH}px, ${CHANGE_COL_WIDTH}px)`
    : `minmax(${LABEL1_WIDTH}px, ${LABEL1_WIDTH}px) minmax(${LABEL2_WIDTH}px, ${LABEL2_WIDTH}px) repeat(24, minmax(28px, 1fr))`;

  const minWidth = LABEL1_WIDTH + LABEL2_WIDTH + 24 * 36 + (showChangeCol ? CHANGE_COL_WIDTH : 0);

  return (
    <Paper sx={{ border: BD, borderRadius: 1, overflow: 'hidden' }} elevation={0}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns, minWidth }}>
          {/* ヘッダー行 */}
          <Box
            sx={{
              gridColumn: 1,
              gridRow: 1,
              p: '8px 12px',
              fontWeight: 600,
              fontSize: '13px',
              bgcolor: '#F6F3F2',
              borderBottom: BD,
              borderRight: BD,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
            }}
          >
            カテゴリ小
          </Box>
          <Box
            sx={{
              gridColumn: 2,
              gridRow: 1,
              p: '8px 12px',
              fontWeight: 600,
              fontSize: '13px',
              bgcolor: '#F6F3F2',
              borderBottom: BD,
              borderRight: BD,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            作業内容
          </Box>
          {HOURS.map((h, i) => (
            <Box
              key={h}
              sx={{
                gridColumn: i + 3,
                gridRow: 1,
                py: 2,
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 500,
                bgcolor: '#F6F3F2',
                borderBottom: BD,
                borderRight: i < HOURS.length - 1 ? BD : showChangeCol ? BD : 'none',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              {h}時
            </Box>
          ))}
          {showChangeCol && (
            <Box
              sx={{
                gridColumn: 27,
                gridRow: 1,
                p: '8px 12px',
                fontWeight: 600,
                fontSize: '13px',
                bgcolor: '#F6F3F2',
                borderBottom: BD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              変更
            </Box>
          )}

          {/* データ行 */}
          {layoutData.map(({ categoryLarge, color, headerRow, taskLayouts }) => (
            <Fragment key={categoryLarge}>
              {/* 大分類ヘッダー行 */}
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  gridRow: headerRow,
                  bgcolor: color,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  py: 1,
                  px: 2,
                  borderBottom: BD,
                  boxSizing: 'border-box',
                }}
              >
                {categoryLarge}
              </Box>

              {taskLayouts.map(({ task, taskStart, taskEnd, rowCount, startRow, packedRows }) => (
                <Fragment key={task.id}>
                  {/* カテゴリ小ラベル */}
                  <Box
                    sx={{
                      gridColumn: 1,
                      gridRow: `${startRow} / ${startRow + rowCount}`,
                      p: '8px 12px',
                      fontWeight: 600,
                      fontSize: '13px',
                      borderLeft: `4px solid ${color}`,
                      borderRight: BD,
                      borderBottom: BD,
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    {task.categorySmall}
                  </Box>

                  {/* 作業内容 / スキル ラベル */}
                  <Box
                    sx={{
                      gridColumn: 2,
                      gridRow: `${startRow} / ${startRow + rowCount}`,
                      p: '8px 12px',
                      fontSize: '13px',
                      color: 'text.secondary',
                      borderRight: BD,
                      borderBottom: BD,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box sx={{ fontWeight: 500, color: 'text.primary', fontSize: '12px' }}>
                      {task.taskContent}
                    </Box>
                    {task.skill && (
                      <Box sx={{ fontSize: '11px', color: 'text.secondary', mt: 0.5 }}>
                        {task.skill}
                      </Box>
                    )}
                  </Box>

                  {/* タイムライン行 */}
                  {packedRows.map((rowBlocks, ri) => (
                    <Box
                      key={ri}
                      sx={{
                        gridColumn: '3 / ' + (showChangeCol ? '27' : '-1'),
                        gridRow: startRow + ri,
                        position: 'relative',
                        minHeight: 56,
                        bgcolor: '#FFFFFF',
                        borderBottom: BD,
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                    >
                      {/* 縦グリッド線 */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(24, 1fr)',
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                        }}
                      >
                        {HOURS.map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              borderRight: i < HOURS.length - 1 ? BD : 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        ))}
                      </Box>

                      {/* 割当バー */}
                      {buildBars(rowBlocks, taskStart, taskEnd).map((bar, bi) => {
                        const left = `${(bar.startH / RANGE_TOTAL) * 100}%`;
                        const width = `${((bar.endH - bar.startH) / RANGE_TOTAL) * 100}%`;
                        const barColor =
                          bar.type === 'employee'
                            ? color
                            : bar.type === 'absent'
                            ? '#9E9E9E'
                            : 'error.main';
                        return (
                          <Box
                            key={bi}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              bottom: 8,
                              left,
                              width,
                              bgcolor: barColor,
                              color: '#fff',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              px: 0.5,
                              opacity: bar.type === 'absent' ? 0.6 : 0.9,
                              '&:hover': { opacity: 1 },
                              textDecoration: bar.type === 'absent' ? 'line-through' : 'none',
                            }}
                          >
                            {bar.label}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}

                  {/* 変更ボタン列 */}
                  {showChangeCol && (
                    <Box
                      sx={{
                        gridColumn: 27,
                        gridRow: `${startRow} / ${startRow + rowCount}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderLeft: BD,
                        borderBottom: BD,
                        boxSizing: 'border-box',
                        p: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onRowChange!(task)}
                        sx={{ fontSize: '12px', minWidth: 56 }}
                      >
                        変更
                      </Button>
                    </Box>
                  )}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

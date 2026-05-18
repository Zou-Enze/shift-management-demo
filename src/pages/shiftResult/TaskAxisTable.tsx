import { Fragment, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Assignment, Category, ShiftRequest } from '../../types';

interface Props {
  assignments: Assignment[];
  categories: Category[];
  shiftRequests: ShiftRequest[];
  resultDate: string;
}

function parseHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + (isFinite(m) ? m / 60 : 0);
}

interface EmpBlock {
  employeeId: string;
  employeeName: string;
  startH: number;
  endH: number;
}

interface CellSpan {
  type: 'employee' | 'unassigned' | 'empty';
  colspan: number;
  label: string;
}

/** 貪欲法で従業員ブロックを required_count 行に詰める（同行内で時間帯が重複しないよう） */
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

/** 1行分のセルスパン列を生成（連続する同種セルは colSpan でまとめる） */
function buildSpans(blocks: EmpBlock[], taskStart: number, taskEnd: number): CellSpan[] {
  type Slot = { type: 'employee' | 'unassigned' | 'empty'; id: string; name: string };
  const slots: Slot[] = Array.from({ length: 24 }, (_, h) => ({
    type: h >= taskStart && h < taskEnd ? 'unassigned' : 'empty',
    id: '',
    name: '',
  }));

  for (const b of blocks) {
    for (let h = Math.floor(b.startH); h < b.endH && h < 24; h++) {
      if (h >= taskStart && h < taskEnd) {
        slots[h] = { type: 'employee', id: b.employeeId, name: b.employeeName };
      }
    }
  }

  const spans: CellSpan[] = [];
  let i = 0;
  while (i < 24) {
    const cur = slots[i];
    let j = i + 1;
    if (cur.type === 'employee') {
      while (j < 24 && slots[j].type === 'employee' && slots[j].id === cur.id) j++;
      spans.push({ type: 'employee', colspan: j - i, label: cur.name });
    } else {
      while (j < 24 && slots[j].type === cur.type) j++;
      spans.push({ type: cur.type, colspan: j - i, label: cur.type === 'unassigned' ? '未割当' : '' });
    }
    i = j;
  }
  return spans;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BD = '1px solid #E0E0E0';

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  slotType: 'employee' | 'unassigned';
}

export default function TaskAxisTable({ assignments, categories, shiftRequests, resultDate }: Props) {
  const normDate = resultDate.replace(/-/g, '/');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenuOpen = useCallback((event: React.MouseEvent, slotType: 'employee' | 'unassigned') => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, slotType });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const reqMap = useMemo(() => {
    const m = new Map<string, { startH: number; endH: number }>();
    shiftRequests
      .filter((r) => r.date.replace(/-/g, '/') === normDate)
      .forEach((r) =>
        m.set(r.employee_id, {
          startH: parseHour(r.preferred_start),
          endH: parseHour(r.preferred_end),
        })
      );
    return m;
  }, [shiftRequests, normDate]);

  const grouped = useMemo(() => {
    const m = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      const list = m.get(a.category_large_id) ?? [];
      list.push(a);
      m.set(a.category_large_id, list);
    });
    return m;
  }, [assignments]);

  // カテゴリの表示順を categories 配列の順序に従って固定する
  const sortedEntries = useMemo(() => {
    const catOrder = categories.map((c) => c.id);
    return Array.from(grouped.entries()).sort(
      (a, b) => catOrder.indexOf(a[0]) - catOrder.indexOf(b[0])
    );
  }, [grouped, categories]);

  return (
    <>
      <Paper sx={{ border: BD, borderRadius: 1, overflowX: 'auto' }} elevation={0}>
        <Table sx={{ tableLayout: 'fixed', minWidth: 80 + 80 + 24 * 44, borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: 80 }} />
            <col style={{ width: 80 }} />
            {HOURS.map((h) => (
              <col key={h} style={{ width: 44 }} />
            ))}
          </colgroup>

          <TableHead>
            <TableRow sx={{ bgcolor: '#F6F3F2' }}>
              <TableCell
                sx={{ fontWeight: 600, fontSize: '13px', borderRight: BD, borderBottom: BD, p: '8px 12px' }}
              >
                カテゴリ小
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: '13px', borderRight: BD, borderBottom: BD, p: '8px 12px' }}
              >
                スキル
              </TableCell>
              {HOURS.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    p: '6px 2px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRight: h < 23 ? BD : 'none',
                    borderBottom: BD,
                  }}
                >
                  {h}時
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedEntries.map(([largeId, list]) => {
              const cat = categories.find((c) => c.id === largeId);
              return (
                <Fragment key={largeId}>
                  {/* 大分類ヘッダー行 */}
                  <TableRow>
                    <TableCell
                      colSpan={26}
                      sx={{
                        bgcolor: cat?.color ?? '#888888',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px',
                        py: 1,
                        px: 2,
                        borderBottom: BD,
                      }}
                    >
                      {cat?.name ?? largeId}
                    </TableCell>
                  </TableRow>

                  {list.map((a) => {
                    const taskStart = Math.floor(parseHour(a.start_time));
                    const taskEnd = Math.ceil(parseHour(a.end_time));
                    const rowCount = Math.max(1, a.required_count);

                    const blocks: EmpBlock[] = a.assigned_employees.map((e) => {
                      const req = reqMap.get(e.employee_id);
                      return {
                        employeeId: e.employee_id,
                        employeeName: e.employee_name,
                        startH: req?.startH ?? taskStart,
                        endH: req?.endH ?? taskEnd,
                      };
                    });

                    const packedRows = packRows(blocks, rowCount);

                    return packedRows.map((rowBlocks, ri) => (
                      <TableRow key={`${a.task_id}-r${ri}`}>
                        {ri === 0 && (
                          <>
                            <TableCell
                              rowSpan={rowCount}
                              sx={{
                                fontWeight: 600,
                                fontSize: '13px',
                                borderLeft: `4px solid ${cat?.color ?? '#888'}`,
                                borderRight: BD,
                                borderBottom: BD,
                                verticalAlign: 'middle',
                                p: '8px 12px',
                              }}
                            >
                              {a.category_small}
                            </TableCell>
                            <TableCell
                              rowSpan={rowCount}
                              sx={{
                                fontSize: '13px',
                                borderRight: BD,
                                borderBottom: BD,
                                verticalAlign: 'middle',
                                p: '8px 12px',
                                color: 'text.secondary',
                              }}
                            >
                              {a.task_name && a.task_name !== a.category_small ? a.task_name : ''}
                            </TableCell>
                          </>
                        )}
                        {buildSpans(rowBlocks, taskStart, taskEnd).map((span, si) => (
                          <TableCell
                            key={si}
                            colSpan={span.colspan}
                            onContextMenu={span.type !== 'empty' ? (e) => handleContextMenuOpen(e, span.type as 'employee' | 'unassigned') : undefined}
                            sx={{
                              p: 0,
                              height: 44,
                              textAlign: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRight: BD,
                              borderBottom: BD,
                              bgcolor:
                                span.type === 'employee'
                                  ? (cat?.color ?? '#888')
                                  : span.type === 'unassigned'
                                  ? 'error.main'
                                  : 'transparent',
                              color: span.type !== 'empty' ? '#fff' : 'inherit',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              cursor: span.type !== 'empty' ? 'context-menu' : 'default',
                            }}
                          >
                            {span.label || null}
                          </TableCell>
                        ))}
                      </TableRow>
                    ));
                  })}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {contextMenu?.slotType === 'employee' ? '割当済みスロット' : '未割当スロット'}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>TODO: 従業員を割り当てる</MenuItem>
        <MenuItem onClick={handleContextMenuClose}>TODO: スロットの詳細を確認</MenuItem>
      </Menu>
    </>
  );
}

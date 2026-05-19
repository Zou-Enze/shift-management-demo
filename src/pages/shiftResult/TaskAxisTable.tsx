import { Fragment, useMemo, useState, useCallback } from 'react';
import { Box, Menu, MenuItem, Paper, Typography } from '@mui/material';
import type { Assignment, Category, ShiftRequest } from '../../types';
import { getCategorySmallNameColor } from '../../constants/categoryColors';

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

interface SpanBar {
  type: 'employee' | 'unassigned';
  startH: number;
  endH: number;
  label: string;
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

/** 1行分の表示バーを計算する（employee / unassigned のみ、empty は除外） */
function buildBars(blocks: EmpBlock[], taskStart: number, taskEnd: number): SpanBar[] {
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

  const bars: SpanBar[] = [];
  let i = 0;
  while (i < 24) {
    const cur = slots[i];
    if (cur.type === 'empty') { i++; continue; }
    let j = i + 1;
    if (cur.type === 'employee') {
      while (j < 24 && slots[j].type === 'employee' && slots[j].id === cur.id) j++;
      bars.push({ type: 'employee', startH: i, endH: j, label: cur.name });
    } else {
      while (j < 24 && slots[j].type === 'unassigned') j++;
      bars.push({ type: 'unassigned', startH: i, endH: j, label: '未割当' });
    }
    i = j;
  }
  return bars;
}

const SKILL_ORDER = ['仕分け', '検品', '梱包'];

const LABEL1_WIDTH = 100;
const LABEL2_WIDTH = 80;
const BD = '1px solid #E0E0E0';
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const RANGE_TOTAL = 24;

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

  const sortedEntries = useMemo(() => {
    const catOrder = categories.map((c) => c.id);
    return Array.from(grouped.entries()).sort(
      (a, b) => catOrder.indexOf(a[0]) - catOrder.indexOf(b[0])
    );
  }, [grouped, categories]);

  const layoutData = useMemo(() => {
    let currentRow = 2;
    return sortedEntries.map(([largeId, list]) => {
      const cat = categories.find((c) => c.id === largeId);
      const headerRow = currentRow++;

      // カテゴリ小でグループ化し、グループ内はスキル順でソート
      const sortedList = [...list].sort((a, b) => {
        const catCompare = a.category_small.localeCompare(b.category_small, 'ja');
        if (catCompare !== 0) return catCompare;
        const aIdx = SKILL_ORDER.indexOf(a.task_name ?? '');
        const bIdx = SKILL_ORDER.indexOf(b.task_name ?? '');
        return (aIdx === -1 ? SKILL_ORDER.length : aIdx) - (bIdx === -1 ? SKILL_ORDER.length : bIdx);
      });

      const assignmentLayouts = sortedList.map((a) => {
        const taskStart = Math.floor(parseHour(a.start_time));
        const taskEnd = Math.ceil(parseHour(a.end_time));
        const rowCount = Math.max(1, a.required_count);
        const startRow = currentRow;
        currentRow += rowCount;

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
        return { a, taskStart, taskEnd, rowCount, startRow, packedRows };
      });

      // カテゴリ小 → スキル の二重グループ化
      type SkillGroup = {
        skill: string;
        startRow: number;
        endRow: number;
        layouts: typeof assignmentLayouts;
      };
      type CatGroup = {
        categorySmall: string;
        startRow: number;
        endRow: number;
        skillGroups: SkillGroup[];
      };
      const catGroups: CatGroup[] = [];
      for (const layout of assignmentLayouts) {
        const lastCat = catGroups[catGroups.length - 1];
        if (lastCat && lastCat.categorySmall === layout.a.category_small) {
          lastCat.endRow = layout.startRow + layout.rowCount;
          const lastSkill = lastCat.skillGroups[lastCat.skillGroups.length - 1];
          if (lastSkill && lastSkill.skill === (layout.a.task_name ?? '')) {
            lastSkill.endRow = layout.startRow + layout.rowCount;
            lastSkill.layouts.push(layout);
          } else {
            lastCat.skillGroups.push({
              skill: layout.a.task_name ?? '',
              startRow: layout.startRow,
              endRow: layout.startRow + layout.rowCount,
              layouts: [layout],
            });
          }
        } else {
          catGroups.push({
            categorySmall: layout.a.category_small,
            startRow: layout.startRow,
            endRow: layout.startRow + layout.rowCount,
            skillGroups: [{
              skill: layout.a.task_name ?? '',
              startRow: layout.startRow,
              endRow: layout.startRow + layout.rowCount,
              layouts: [layout],
            }],
          });
        }
      }

      return { largeId, cat, headerRow, catGroups };
    });
  }, [sortedEntries, categories, reqMap]);

  const gridTemplateColumns = `minmax(${LABEL1_WIDTH}px, ${LABEL1_WIDTH}px) minmax(${LABEL2_WIDTH}px, ${LABEL2_WIDTH}px) repeat(24, minmax(28px, 1fr))`;

  return (
    <>
      <Paper sx={{ border: BD, borderRadius: 1, overflow: 'hidden' }} elevation={0}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns,
              minWidth: LABEL1_WIDTH + LABEL2_WIDTH + 24 * 36,
            }}
          >
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
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
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
              スキル
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
                  borderRight: i < HOURS.length - 1 ? BD : 'none',
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
              >
                {h}時
              </Box>
            ))}

            {/* データ行 */}
            {layoutData.map(({ largeId, cat, headerRow, catGroups }) => (
              <Fragment key={largeId}>
                {/* 大分類ヘッダー行 */}
                <Box
                  sx={{
                    gridColumn: '1 / -1',
                    gridRow: headerRow,
                    bgcolor: cat?.color ?? '#888888',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    py: 1,
                    px: 2,
                    borderBottom: BD,
                    boxSizing: 'border-box',
                  }}
                >
                  {cat?.name ?? largeId}
                </Box>

                {catGroups.map((catGroup) => (
                  <Fragment key={`${catGroup.categorySmall}-${catGroup.startRow}`}>
                    {/* カテゴリ小ラベル（カテゴリ小グループ全体にスパン） */}
                    <Box
                      sx={{
                        gridColumn: 1,
                        gridRow: `${catGroup.startRow} / ${catGroup.endRow}`,
                        p: '8px 12px',
                        fontWeight: 600,
                        fontSize: '13px',
                        borderLeft: `4px solid ${getCategorySmallNameColor(catGroup.categorySmall)}`,
                        borderRight: BD,
                        borderBottom: BD,
                        display: 'flex',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                      }}
                    >
                      {catGroup.categorySmall}
                    </Box>

                    {catGroup.skillGroups.map((skillGroup) => (
                      <Fragment key={`${skillGroup.skill}-${skillGroup.startRow}`}>
                        {/* スキルラベル（スキルグループ全体にスパン） */}
                        <Box
                          sx={{
                            gridColumn: 2,
                            gridRow: `${skillGroup.startRow} / ${skillGroup.endRow}`,
                            p: '8px 12px',
                            fontSize: '13px',
                            color: 'text.secondary',
                            borderRight: BD,
                            borderBottom: BD,
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                          }}
                        >
                          {skillGroup.skill !== catGroup.categorySmall ? skillGroup.skill : ''}
                        </Box>

                        {skillGroup.layouts.map(({ a, taskStart, taskEnd, startRow, packedRows }) => (
                          <Fragment key={a.task_id}>
                            {/* タイムライン行 */}
                            {packedRows.map((rowBlocks, ri) => (
                              <Box
                                key={ri}
                                sx={{
                                  gridColumn: '3 / -1',
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
                                  return (
                                    <Box
                                      key={bi}
                                      onContextMenu={(e) => handleContextMenuOpen(e, bar.type)}
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        bottom: 8,
                                        left,
                                        width,
                                        bgcolor: bar.type === 'employee' ? (cat?.color ?? '#888') : 'error.main',
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
                                        cursor: 'context-menu',
                                        opacity: 0.9,
                                        '&:hover': { opacity: 1 },
                                      }}
                                    >
                                      {bar.label}
                                    </Box>
                                  );
                                })}
                              </Box>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </Box>
        </Box>
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

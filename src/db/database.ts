import Dexie, { type EntityTable } from 'dexie';
import type {
  Category,
  Skill,
  Mode,
  Employee,
  ShiftRequest,
  ShiftResult,
  TaskRow,
  DailyAdjustSummary,
} from '../types';

export const db = new Dexie('ShiftMgrDB') as Dexie & {
  categories: EntityTable<Category, 'id'>;
  skills: EntityTable<Skill, 'id'>;
  modes: EntityTable<Mode, 'id'>;
  employees: EntityTable<Employee, 'id'>;
  shift_requests: EntityTable<ShiftRequest, 'id'>;
  shift_results: EntityTable<ShiftResult, 'id'>;
  task_rows: EntityTable<TaskRow, 'id'>;
  daily_adjust_summaries: EntityTable<DailyAdjustSummary, 'id'>;
};

db.version(1).stores({
  categories: '&id, name',
  skills: '&id, name',
  modes: '&id, name',
  employees: '&id, name',
  shift_requests: '&id, date, employee_id',
  shift_results: '&id',
  task_rows: '&id, category_large_id',
});

db.version(2).stores({
  categories: '&id, name',
  skills: '&id, name',
  modes: '&id, name',
  employees: '&id, name',
  shift_requests: '&id, date, employee_id',
  shift_results: '&id',
  task_rows: '&id, category_large_id',
}).upgrade(async (tx) => {
  await tx.table('modes').clear();
});

db.version(3).stores({
  categories: '&id, name',
  skills: '&id, name',
  modes: '&id, name',
  employees: '&id, name',
  shift_requests: '&id, date, employee_id',
  shift_results: '&id',
  task_rows: '&id, category_large_id',
  daily_adjust_summaries: '&id, date',
});

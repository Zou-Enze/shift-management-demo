import { db } from './database';
import type {
  Category,
  Skill,
  Mode,
  Employee,
  ShiftRequest,
  ShiftResult,
} from '../types';

export async function seedIfEmpty(): Promise<void> {
  const count = await db.categories.count();
  if (count > 0) {
    await seedModesIfEmpty();
    return;
  }

  const [cats, skills, workloads, emps, reqs, result] = await Promise.all([
    fetch('/data/categories.json').then((r) => r.json()) as Promise<{ categories: Category[] }>,
    fetch('/data/skills.json').then((r) => r.json()) as Promise<{ skills: Skill[] }>,
    fetch('/data/workloads.json').then((r) => r.json()) as Promise<{ workloads: Mode[] }>,
    fetch('/data/employees.json').then((r) => r.json()) as Promise<{ employees: Employee[] }>,
    fetch('/data/shift_requests.json').then((r) => r.json()) as Promise<{
      shift_requests: ShiftRequest[];
    }>,
    fetch('/data/shift_result.json').then((r) => r.json()) as Promise<{
      shift_result: ShiftResult;
    }>,
  ]);

  await db.transaction(
    'rw',
    [db.categories, db.skills, db.modes, db.employees, db.shift_requests, db.shift_results],
    async () => {
      await db.categories.bulkAdd(cats.categories);
      await db.skills.bulkAdd(skills.skills);
      await db.modes.bulkAdd(workloads.workloads);
      await db.employees.bulkAdd(emps.employees);
      await db.shift_requests.bulkAdd(reqs.shift_requests);
      await db.shift_results.add(result.shift_result);
    }
  );
}

async function seedModesIfEmpty(): Promise<void> {
  const modesCount = await db.modes.count();
  if (modesCount > 0) return;

  const { workloads } = await fetch('/data/workloads.json').then((r) => r.json()) as { workloads: Mode[] };
  await db.modes.bulkAdd(workloads);
}

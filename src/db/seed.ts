import { db } from './database';
import type {
  Category,
  Skill,
  Mode,
  Employee,
  ShiftRequest,
  ShiftResult,
  AssignmentRule,
} from '../types';

const DEMO_DATA_VERSION = '2026-05-26-shift-demo-v4';
const DEMO_DATA_VERSION_KEY = 'shift-management-demo:data-version';

export async function seedIfEmpty(): Promise<void> {
  const count = await db.categories.count();
  if (count > 0) {
    await syncDemoDataIfNeeded();
    await seedModesIfEmpty();
    await seedAssignmentRulesIfEmpty();
    return;
  }

  const [cats, skills, workloads, emps, reqs, result, rules] = await Promise.all([
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
    fetch('/data/assignment_rules.json').then((r) => r.json()) as Promise<{
      assignment_rules: AssignmentRule[];
    }>,
  ]);

  await db.transaction(
    'rw',
    [db.categories, db.skills, db.modes, db.employees, db.shift_requests, db.shift_results, db.assignment_rules],
    async () => {
      await db.categories.bulkAdd(cats.categories);
      await db.skills.bulkAdd(skills.skills);
      await db.modes.bulkAdd(workloads.workloads);
      await db.employees.bulkAdd(emps.employees);
      await db.shift_requests.bulkAdd(reqs.shift_requests);
      await db.shift_results.add(result.shift_result);
      await db.assignment_rules.bulkAdd(rules.assignment_rules);
    }
  );

  localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
}

async function syncDemoDataIfNeeded(): Promise<void> {
  if (localStorage.getItem(DEMO_DATA_VERSION_KEY) === DEMO_DATA_VERSION) return;

  const [workloads, reqs] = await Promise.all([
    fetch('/data/workloads.json').then((r) => r.json()) as Promise<{ workloads: Mode[] }>,
    fetch('/data/shift_requests.json').then((r) => r.json()) as Promise<{
      shift_requests: ShiftRequest[];
    }>,
  ]);

  await db.transaction('rw', [db.modes, db.shift_requests, db.task_rows, db.shift_results], async () => {
    await db.modes.clear();
    await db.shift_requests.clear();
    await db.task_rows.clear();
    await db.shift_results.clear();

    await db.modes.bulkAdd(workloads.workloads);
    await db.shift_requests.bulkAdd(reqs.shift_requests);
  });

  localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
}

async function seedModesIfEmpty(): Promise<void> {
  const modesCount = await db.modes.count();
  if (modesCount > 0) return;

  const { workloads } = await fetch('/data/workloads.json').then((r) => r.json()) as { workloads: Mode[] };
  await db.modes.bulkAdd(workloads);
}

async function seedAssignmentRulesIfEmpty(): Promise<void> {
  const rulesCount = await db.assignment_rules.count();
  if (rulesCount > 0) return;

  const { assignment_rules } = await fetch('/data/assignment_rules.json').then((r) => r.json()) as { assignment_rules: AssignmentRule[] };
  await db.assignment_rules.bulkAdd(assignment_rules);
}

export async function resetDatabase(): Promise<void> {
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

  const { assignment_rules } = await fetch('/data/assignment_rules.json').then((r) => r.json()) as { assignment_rules: AssignmentRule[] };

  await db.transaction(
    'rw',
    [db.categories, db.skills, db.modes, db.employees, db.shift_requests, db.shift_results, db.task_rows, db.assignment_rules],
    async () => {
      await db.categories.clear();
      await db.skills.clear();
      await db.modes.clear();
      await db.employees.clear();
      await db.shift_requests.clear();
      await db.shift_results.clear();
      await db.task_rows.clear();
      await db.assignment_rules.clear();

      await db.categories.bulkAdd(cats.categories);
      await db.skills.bulkAdd(skills.skills);
      await db.modes.bulkAdd(workloads.workloads);
      await db.employees.bulkAdd(emps.employees);
      await db.shift_requests.bulkAdd(reqs.shift_requests);
      await db.shift_results.add(result.shift_result);
      await db.assignment_rules.bulkAdd(assignment_rules);
    }
  );

  localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
}

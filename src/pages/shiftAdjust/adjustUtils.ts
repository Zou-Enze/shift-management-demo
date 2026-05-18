import * as XLSX from 'xlsx';
import type { AdjustEmployee, AdjustRow } from './adjustTypes';

function extractDate(dt: string): string {
  return dt.trim().split(' ')[0] ?? '';
}

export function parseExcelFile(file: File): Promise<{ date: string; rows: AdjustRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const taskMap = new Map<
          string,
          {
            categoryLarge: string;
            categorySmall: string;
            startDateTime: string;
            endDateTime: string;
            taskContent: string;
            skill: string;
            requiredCount: number;
            employees: AdjustEmployee[];
          }
        >();

        for (const rawRow of jsonData) {
          const categoryLarge = String(rawRow['カテゴリ大'] ?? '');
          const categorySmall = String(rawRow['カテゴリ小'] ?? '');
          const startDateTime = String(rawRow['開始時間'] ?? '');
          const endDateTime = String(rawRow['終了時間'] ?? '');
          const taskContent = String(rawRow['作業内容'] ?? '');
          const skill = String(rawRow['スキル'] ?? '');
          const requiredCount = Number(rawRow['要員数'] ?? 0);
          const employeeId = String(rawRow['割当要員ID'] ?? '').trim();
          const employeeName = String(rawRow['割当要員名前'] ?? '').trim();

          const key = `${categoryLarge}||${categorySmall}||${startDateTime}||${endDateTime}||${taskContent}||${skill}`;

          if (!taskMap.has(key)) {
            taskMap.set(key, {
              categoryLarge,
              categorySmall,
              startDateTime,
              endDateTime,
              taskContent,
              skill,
              requiredCount,
              employees: [],
            });
          }

          const task = taskMap.get(key)!;
          if (employeeId) {
            task.employees.push({ id: employeeId, name: employeeName });
          }
        }

        const rows: AdjustRow[] = Array.from(taskMap.values()).map((task, i) => ({
          id: `adj-${i}-${Date.now()}`,
          categoryLarge: task.categoryLarge,
          categorySmall: task.categorySmall,
          startDateTime: task.startDateTime,
          endDateTime: task.endDateTime,
          taskContent: task.taskContent,
          skill: task.skill,
          requiredCount: task.requiredCount,
          assignedEmployees: task.employees,
          absentEmployees: [],
        }));

        const date = rows[0] ? extractDate(rows[0].startDateTime) : '';
        resolve({ date, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsBinaryString(file);
  });
}

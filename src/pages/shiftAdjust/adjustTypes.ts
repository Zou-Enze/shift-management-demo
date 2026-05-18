export interface AdjustEmployee {
  id: string;
  name: string;
}

export interface AdjustRow {
  id: string;
  categoryLarge: string;
  categorySmall: string;
  startDateTime: string;
  endDateTime: string;
  taskContent: string;
  skill: string;
  requiredCount: number;
  assignedEmployees: AdjustEmployee[];
  absentEmployees: AdjustEmployee[];
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sub_categories: SubCategory[];
}

export interface Skill {
  id: string;
  name: string;
}

export interface WorkloadTaskPreset {
  skill_id: string;
  start_time: string;
  end_time: string;
  required_count: number;
}

export interface WorkloadSmallPreset {
  category_small_id: string;
  tasks: WorkloadTaskPreset[];
}

export interface WorkloadLargePreset {
  category_large_id: string;
  small_categories: WorkloadSmallPreset[];
}

export interface Mode {
  id: string;
  name: string;
  preset_categories?: WorkloadLargePreset[];
  is_custom?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  skills: string[];
}

export interface ShiftRequest {
  id: string;
  date: string;
  employee_id: string;
  employee_name: string;
  preferred_start: string;
  preferred_end: string;
}

export interface AssignedEmployee {
  employee_id: string;
  employee_name: string;
}

export interface Assignment {
  task_id: string;
  category_large_id: string;
  category_large: string;
  category_small_id: string;
  category_small: string;
  start_time: string;
  end_time: string;
  task_name: string;
  skill_id: string;
  skill: string;
  required_count: number;
  assigned_count: number;
  shortage: number;
  assigned_employees: AssignedEmployee[];
}

export interface ShiftSummary {
  total_assigned: number;
  total_hours: number;
  shortage_hours: number;
}

export interface ShiftResult {
  id: string;
  period_start: string;
  period_end: string;
  mode: string;
  summary: ShiftSummary;
  assignments: Assignment[];
}

export interface TaskRow {
  id: string;
  category_large_id: string;
  category_small_id: string;
  /** yyyy/mm/dd（作業内容設定の対象日・反映時に保存） */
  task_date?: string;
  start_time: string;
  end_time: string;
  task_name: string;
  skill_id: string;
  required_count: number;
}

export interface DailyAdjustSummary {
  id: string;
  date: string;
  before_summary?: ShiftSummary;
  after_summary?: ShiftSummary;
  assignments: Assignment[];
}

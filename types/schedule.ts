export interface ScheduleDTO {
  id: string;
  department: string;
  status: 'Active' | 'Draft';
  classCount: number;
  staffCount: number;
  lastUpdated: string;
}
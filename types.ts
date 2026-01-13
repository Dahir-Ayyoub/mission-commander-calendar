
export interface Mission {
  id: string;
  date: Date;
  mission: string;
  status?: 'pending' | 'completed' | 'urgent';
  details: Record<string, any>; // Stores all columns from the original row
}

export interface ExcelRow {
  [key: string]: any;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  missions: Mission[];
}

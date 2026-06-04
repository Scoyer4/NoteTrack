export interface Task {
  id: string;
  note_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = {
  note_id: string;
  title: string;
  position?: number;
  due_date?: string | null;  
}

export type TaskUpdate = {
  title?: string;
  is_completed?: boolean;
  position?: number;
  due_date?: string | null;
}
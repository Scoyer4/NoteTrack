export const CHECKLIST_MARKER = '__checklist__';

export type NoteColor =
  | 'default' | 'yellow' | 'green' | 'blue'
  | 'purple'  | 'pink'   | 'red'   | 'orange';

export interface User {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Note {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

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

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

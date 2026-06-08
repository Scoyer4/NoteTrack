export type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'purple'| 'pink' | 'red' | 'orange';


export interface Notes {
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
  tags?: { id: string; name: string; color: string }[];
}

export type NotesInsert = {
  user_id: string;
  folder_id?: string | null;
  title?: string;
  content?: string;
  color?: NoteColor;
};

export type NotesUpdate = {
  folder_id?: string | null;
  title?: string;
  content?: string;
  color?: NoteColor;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
}
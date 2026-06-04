export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type FolderInsert = {
  user_id: string;
  name: string;
  color?: string;
  icon?: string;
  position?: number;
}

export type FolderUpdate = {
  name?: string;
  color?: string;
  icon?: string;
  position?: number;
}
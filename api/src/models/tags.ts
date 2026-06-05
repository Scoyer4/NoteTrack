export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type TagInsert = {
  user_id: string;
  name: string;
  color?: string;
}

export type TagUpdate = {
  name?: string;
  color?: string;
}
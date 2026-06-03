import { Notes, NotesInsert, NotesUpdate } from '@/models/notes';
import supabase from '@/config/db';

export const notesRepository = {
  findAll: async (userId: string, search?: string, folderId?: string): Promise<Notes[]> => {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%`
      );
    }

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Notes[];
  },

  create: async (notes: NotesInsert): Promise<Notes> => {
    const { data, error } = await supabase
      .from("notes")
      .upsert(notes)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Notes;
  },

  findById: async (id: string, userId: string): Promise<Notes | null> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as (Notes | null);
  },

  findPinned: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Notes[];
  },

  findArchived: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", true)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Notes[];
  },

  findDeleted: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", true)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Notes[];
  },

  update: async (id: string, updatesNote: NotesUpdate): Promise<Notes> => {
    const { data, error } = await supabase
      .from("notes")
      .update(updatesNote)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Notes;
  },

  findByFolder: async (folderId: string, userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("folder_id", folderId)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
    if (error) throw new Error(error.message);
    return (data ?? []) as Notes[];
  },
  
  softDelete: async (id: string): Promise<Notes> => {
  const { data, error } = await supabase
    .from('notes')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Notes;
},

hardDelete: async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
},
}
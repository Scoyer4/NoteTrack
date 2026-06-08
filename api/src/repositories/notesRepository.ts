import { Notes, NotesInsert, NotesUpdate } from '@/models/notes';
import supabase from '@/config/db';

const WITH_TAGS = '*, note_tags(tags(id, name, color))';

function withTags(data: any[]): Notes[] {
  return data.map(({ note_tags, ...rest }) => ({
    ...rest,
    tags: (note_tags ?? []).map((nt: any) => nt.tags).filter(Boolean),
  }));
}

export const notesRepository = {
  findAll: async (userId: string, search?: string, folderId?: string): Promise<Notes[]> => {
    let query = supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return withTags(data ?? []);
  },

  create: async (note: NotesInsert): Promise<Notes> => {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select(WITH_TAGS)
      .single();
    if (error) throw new Error(error.message);
    return withTags([data as any])[0];
  },

  findById: async (id: string, userId: string): Promise<Notes | null> => {
    const { data, error } = await supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return withTags([data as any])[0];
  },

  findPinned: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return withTags(data ?? []);
  },

  findArchived: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('user_id', userId)
      .eq('is_archived', true)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return withTags(data ?? []);
  },

  findDeleted: async (userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('user_id', userId)
      .eq('is_deleted', true)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return withTags(data ?? []);
  },

  update: async (id: string, updatesNote: NotesUpdate): Promise<Notes> => {
    const { data, error } = await supabase
      .from('notes')
      .update(updatesNote)
      .eq('id', id)
      .select(WITH_TAGS)
      .single();
    if (error) throw new Error(error.message);
    return withTags([data as any])[0];
  },

  findByFolder: async (folderId: string, userId: string): Promise<Notes[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(WITH_TAGS)
      .eq('folder_id', folderId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return withTags(data ?? []);
  },

  softDelete: async (id: string): Promise<Notes> => {
    const { data, error } = await supabase
      .from('notes')
      .update({ is_deleted: true })
      .eq('id', id)
      .select(WITH_TAGS)
      .single();
    if (error) throw new Error(error.message);
    return withTags([data as any])[0];
  },

  hardDelete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

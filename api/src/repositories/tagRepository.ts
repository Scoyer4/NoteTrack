import { Tag, TagInsert, TagUpdate } from '@/models/tags';
import supabase from '@/config/db';

export const tagRepository = {
   // Obtener todos los tags
  findAll: async (userId: string): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Tag[];
  },

   // Obtener tag por ID
  findById: async (id: string, userId: string): Promise<Tag | null> => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Tag | null;
  },

   // Obtener tag por nota
  findByNote: async (noteId: string): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from("note_tags")
      .select("tags(*)")
      .eq("note_id", noteId);
    if (error) throw new Error(error.message);
    const tags = (data ?? []).map((row: any) => row.tags);
    return tags as Tag[];
  },

   // Crear tag nuevo
  create: async (tag: TagInsert): Promise<Tag> => {
    const { data, error } = await supabase
      .from("tags")
      .insert(tag)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Tag;
  },

   // Actualizar tag
  update: async (id: string, updatedTag: TagUpdate): Promise<Tag> => {
    const { data, error } = await supabase
      .from("tags")
      .update(updatedTag)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Tag;
  },

   // Eliminar tag
  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

   // Añadir tag a una nota
  addToNote: async (noteId: string, tagId: string): Promise<void> => {
    const { error } = await supabase
      .from("note_tags")
      .insert({
        note_id: noteId,
        tag_id: tagId,
      });
    if (error) throw new Error(error.message);
  },

   // Eliminar tag de una nota
  removeFromNote: async (noteId: string, tagId: string): Promise<void> => {
    const { error } = await supabase
      .from("note_tags")
      .delete()
      .eq("note_id", noteId)
      .eq("tag_id", tagId);
    if (error) throw new Error(error.message);
  }
};
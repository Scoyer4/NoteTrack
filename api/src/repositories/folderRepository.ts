import { Folder, FolderInsert, FolderUpdate } from '@/models/folders';
import supabase from '@/config/db';

export const folderRepository = {
   // Obtener todas las carpetas del usuario
  findAll: async (userId: string): Promise<Folder[]> => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Folder[];
  },
   
   // Obtener una carpeta por ID
  findById: async (id: string, userId: string): Promise<Folder | null> => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Folder | null;
  },

   // Crear una carpeta nueva
  create: async (folder: FolderInsert): Promise<Folder> => {
    const { data, error } = await supabase
      .from("folders")
      .insert(folder)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Folder;
  },

   // Actualizar una carpeta
  update: async (id: string, folderUpdated: FolderUpdate): Promise<Folder> => {
    const { data, error } = await supabase
      .from("folders")
      .update(folderUpdated)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Folder;
  },

   // Borrar una carpeta
  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
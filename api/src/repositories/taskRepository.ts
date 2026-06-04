import { Task, TaskInsert, TaskUpdate } from '@/models/tasks';
import supabase from '@/config/db';

export const taskRepository = {
   // Obtener las tareas por cada nota
  findByNote: async (noteId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("note_id", noteId)
      .order("position", { ascending: true })
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? []) as Task[];
  },

   // Obtener una tarea por ID
  findById: async (id: string): Promise<Task | null> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Task | null;
  },

   // Obtener la siguiente tarea
  findUpcoming: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        notes!inner(user_id, title)
      `)
      .eq('notes.user_id', userId)
      .eq('is_completed', false)
      .not('due_date', 'is', null)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Task[];
  },

   // Crear una tarea
  create: async (task: TaskInsert): Promise<Task> => {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  },

   // Actualizar una tarea
  update: async (id: string, taskUpdate: TaskUpdate): Promise<Task> => {
    const { data, error } = await supabase
      .from("tasks")
      .update(taskUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Task;
  },

   // Eliminar una tarea
  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
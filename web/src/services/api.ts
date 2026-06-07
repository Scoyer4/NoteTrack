import type { AuthSession, Note, Folder, Tag, Task, User, NoteColor } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Error en la petición');
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  register: (email: string, password: string, username: string) =>
    request<{ message: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  login: (email: string, password: string) =>
    request<{ session: AuthSession; user: { id: string; email: string; user_metadata: { username?: string } } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// ── Notes ─────────────────────────────────────────────────────────────────────

export const notesService = {
  getAll: (params?: { search?: string; folderId?: string }) => {
    const q = new URLSearchParams();
    if (params?.search)   q.set('search', params.search);
    if (params?.folderId) q.set('folderId', params.folderId);
    return request<Note[]>(`/notes${q.size ? `?${q}` : ''}`);
  },
  getPinned:   () => request<Note[]>('/notes/pinned'),
  getArchived: () => request<Note[]>('/notes/archived'),
  getDeleted:  () => request<Note[]>('/notes/deleted'),
  getById:     (id: string) => request<Note>(`/notes/${id}`),
  create: (data: { title: string; content?: string; color?: NoteColor; folder_id?: string | null }) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'color' | 'folder_id' | 'is_pinned' | 'is_archived'>>) =>
    request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  pin:       (id: string) => request<Note>(`/notes/${id}/pin`,     { method: 'PATCH' }),
  archive:   (id: string) => request<Note>(`/notes/${id}/archive`, { method: 'PATCH' }),
  softDelete:(id: string) => request<Note>(`/notes/${id}/delete`,  { method: 'PATCH' }),
  restore:   (id: string) => request<Note>(`/notes/${id}/restore`, { method: 'PATCH' }),
  hardDelete:(id: string) => request<void>(`/notes/${id}`,         { method: 'DELETE' }),
};

// ── Folders ───────────────────────────────────────────────────────────────────

export const foldersService = {
  getAll:  () => request<Folder[]>('/folders'),
  getById: (id: string) => request<Folder>(`/folders/${id}`),
  create:  (data: { name: string; color?: string; icon?: string }) =>
    request<Folder>('/folders', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: Partial<Pick<Folder, 'name' | 'color' | 'icon' | 'position'>>) =>
    request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove:  (id: string) => request<void>(`/folders/${id}`, { method: 'DELETE' }),
};

// ── Tags ──────────────────────────────────────────────────────────────────────

export const tagsService = {
  getAll:     () => request<Tag[]>('/tags'),
  create:     (data: { name: string; color?: string }) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id: string, data: Partial<Pick<Tag, 'name' | 'color'>>) =>
    request<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove:     (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  addToNote:  (noteId: string, tagId: string) =>
    request<void>(`/tags/note/${noteId}/${tagId}`, { method: 'POST' }),
  removeFromNote: (noteId: string, tagId: string) =>
    request<void>(`/tags/note/${noteId}/${tagId}`, { method: 'DELETE' }),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasksService = {
  getByNote:  (noteId: string) => request<Task[]>(`/tasks/note/${noteId}`),
  getUpcoming:() => request<Task[]>('/tasks/upcoming'),
  create:     (noteId: string, data: { title: string; due_date?: string | null }) =>
    request<Task>(`/tasks/note/${noteId}`, { method: 'POST', body: JSON.stringify(data) }),
  update:     (id: string, data: Partial<Pick<Task, 'title' | 'is_completed' | 'position' | 'due_date'>>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove:     (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersService = {
  me:     () => request<User>('/users/me'),
  update: (data: Partial<Pick<User, 'username' | 'full_name' | 'avatar_url'>>) =>
    request<{ user: User }>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
};

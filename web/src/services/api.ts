import type { AuthSession, Note, Tag, Task, User, NoteColor } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

// Deduplicates concurrent refresh calls — only one in-flight at a time
let _refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      const data: { session: AuthSession } = await res.json();
      localStorage.setItem('access_token',  data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token);
      localStorage.setItem('expires_at',    String(data.session.expires_at));
      return data.session.access_token;
    } catch {
      return null;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
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

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
    }
    // Retry original request with the fresh token
    const retryRes = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    });
    if (retryRes.status === 204) return undefined as T;
    const retryData = await retryRes.json();
    if (!retryRes.ok) throw new Error(retryData.error ?? 'Error en la petición');
    return retryData as T;
  }

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

  refresh: () => tryRefresh(),
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
  create: (data: { title: string; content?: string; color?: NoteColor }) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'color' | 'is_pinned' | 'is_archived'>>) =>
    request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  pin:       (id: string) => request<Note>(`/notes/${id}/pin`,     { method: 'PATCH' }),
  archive:   (id: string) => request<Note>(`/notes/${id}/archive`, { method: 'PATCH' }),
  softDelete:(id: string) => request<Note>(`/notes/${id}/delete`,  { method: 'PATCH' }),
  restore:   (id: string) => request<Note>(`/notes/${id}/restore`, { method: 'PATCH' }),
  hardDelete:(id: string) => request<void>(`/notes/${id}`,         { method: 'DELETE' }),
};

// ── Tags ──────────────────────────────────────────────────────────────────────

export const tagsService = {
  getAll:     () => request<Tag[]>('/tags'),
  getByNote:  (noteId: string) => request<Tag[]>(`/tags/note/${noteId}`),
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
    request<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

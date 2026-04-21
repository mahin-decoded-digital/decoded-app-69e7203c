import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { SyncDescriptor, Task, TaskInput, TaskQueryState } from '@/types/task';
import { buildSyncCode, buildSyncUrl, extractSyncBucketId } from '@/lib/task-utils';

interface TaskStoreState {
  tasks: Task[];
  query: TaskQueryState;
  selectedTaskIds: string[];
  sync: SyncDescriptor | null;
  isSyncing: boolean;
  syncError: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<{ success: boolean; message?: string }>;
  updateTask: (id: string, input: TaskInput) => Promise<{ success: boolean; message?: string }>;
  deleteTask: (id: string) => Promise<void>;
  bulkDeleteSelected: () => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  setSearch: (search: string) => void;
  setFilter: (filter: TaskQueryState['filter']) => void;
  setSortBy: (sortBy: TaskQueryState['sortBy']) => void;
  toggleTaskSelection: (id: string) => void;
  clearSelection: () => void;
  selectVisibleTasks: (ids: string[]) => void;
  createSyncLink: () => Promise<{ success: boolean; message: string }>;
  importFromSyncInput: (input: string) => Promise<{ success: boolean; message: string }>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  clearSyncError: () => void;
}

const initialQuery: TaskQueryState = {
  search: '',
  filter: 'all',
  sortBy: 'dueDate',
};

function sanitizeTaskInput(input: TaskInput): TaskInput {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: input.dueDate ? input.dueDate : null,
  };
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export const useTaskStore = create<TaskStoreState>()((set, get) => ({
  tasks: [],
  query: initialQuery,
  selectedTaskIds: [],
  sync: null,
  isSyncing: false,
  syncError: null,
  loading: false,
  loaded: false,
  error: null,
  fetchTasks: async () => {
    if (get().loading || get().loaded) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const currentSync = get().sync;
      const url = currentSync
        ? apiUrl(`/api/tasks?bucketId=${encodeURIComponent(currentSync.bucketId)}`)
        : apiUrl('/api/tasks');
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const tasks = await parseJsonResponse<Task[]>(res);
      set({ tasks, loading: false, loaded: true, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tasks',
      });
    }
  },
  createTask: async (input) => {
    const sanitized = sanitizeTaskInput(input);
    if (!sanitized.title) {
      return { success: false, message: 'Task title is required.' };
    }

    try {
      set({ error: null });
      const res = await fetch(apiUrl('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          bucketId: get().sync?.bucketId ?? null,
        }),
      });

      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to create task.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const created = await parseJsonResponse<Task>(res);
      set((state) => ({ tasks: [created, ...state.tasks] }));
      void get().syncNow();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create task.';
      set({ error: message });
      return { success: false, message };
    }
  },
  updateTask: async (id, input) => {
    const sanitized = sanitizeTaskInput(input);
    if (!sanitized.title) {
      return { success: false, message: 'Task title is required.' };
    }

    const existing = get().tasks.find((task) => task.id === id);
    if (!existing) {
      return { success: false, message: 'Task not found.' };
    }

    try {
      set({ error: null });
      const res = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          completed: existing.completed,
          bucketId: get().sync?.bucketId ?? null,
        }),
      });

      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to update task.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const updated = await parseJsonResponse<Task>(res);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
      }));
      void get().syncNow();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task.';
      set({ error: message });
      return { success: false, message };
    }
  },
  deleteTask: async (id) => {
    try {
      set({ error: null });
      const res = await fetch(apiUrl(`/api/tasks/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to delete task.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTaskIds: state.selectedTaskIds.filter((taskId) => taskId !== id),
      }));
      void get().syncNow();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete task.';
      set({ error: message });
    }
  },
  bulkDeleteSelected: async () => {
    const ids = get().selectedTaskIds;
    if (ids.length === 0) {
      return;
    }

    try {
      set({ error: null });
      const res = await fetch(apiUrl('/api/tasks/bulk-delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to delete selected tasks.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => !ids.includes(task.id)),
        selectedTaskIds: [],
      }));
      void get().syncNow();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete selected tasks.';
      set({ error: message });
    }
  },
  toggleTaskCompletion: async (id) => {
    const existing = get().tasks.find((task) => task.id === id);
    if (!existing) {
      set({ error: 'Task not found.' });
      return;
    }

    try {
      set({ error: null });
      const res = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: existing.title,
          description: existing.description,
          dueDate: existing.dueDate,
          completed: !existing.completed,
          bucketId: get().sync?.bucketId ?? null,
        }),
      });
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to update task status.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const updated = await parseJsonResponse<Task>(res);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
      }));
      void get().syncNow();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task status.';
      set({ error: message });
    }
  },
  setSearch: (search) => set((state) => ({ query: { ...state.query, search } })),
  setFilter: (filter) => set((state) => ({ query: { ...state.query, filter } })),
  setSortBy: (sortBy) => set((state) => ({ query: { ...state.query, sortBy } })),
  toggleTaskSelection: (id) =>
    set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(id)
        ? state.selectedTaskIds.filter((taskId) => taskId !== id)
        : [...state.selectedTaskIds, id],
    })),
  clearSelection: () => set({ selectedTaskIds: [] }),
  selectVisibleTasks: (ids) => set({ selectedTaskIds: ids }),
  createSyncLink: async () => {
    set({ isSyncing: true, syncError: null });

    try {
      const res = await fetch(apiUrl('/api/sync/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId: get().sync?.bucketId ?? null }),
      });
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to create sync link.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const descriptor = await parseJsonResponse<SyncDescriptor>(res);
      set((state) => ({
        sync: {
          ...descriptor,
          syncCode: buildSyncCode(descriptor.bucketId),
          syncUrl: buildSyncUrl(descriptor.bucketId),
        },
        isSyncing: false,
        syncError: null,
        tasks: state.tasks.map((task) => ({ ...task })),
      }));
      await get().syncNow();
      return { success: true, message: 'Sync link created and task list uploaded.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create sync link.';
      set({ isSyncing: false, syncError: message });
      return { success: false, message };
    }
  },
  importFromSyncInput: async (input) => {
    set({ isSyncing: true, syncError: null });
    const bucketId = extractSyncBucketId(input);
    if (!bucketId) {
      const message = 'Paste a valid sync link or bucket code.';
      set({ isSyncing: false, syncError: message });
      return { success: false, message };
    }

    try {
      const res = await fetch(apiUrl(`/api/sync/${bucketId}`));
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to import shared tasks.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await parseJsonResponse<{ tasks: Task[]; sync: SyncDescriptor; updatedAt: string | null }>(res);
      set({
        tasks: data.tasks,
        sync: {
          ...data.sync,
          syncCode: buildSyncCode(data.sync.bucketId),
          syncUrl: buildSyncUrl(data.sync.bucketId),
          lastSyncedAt: data.sync.lastSyncedAt ?? data.updatedAt,
        },
        selectedTaskIds: [],
        isSyncing: false,
        syncError: null,
        loaded: true,
        loading: false,
        error: null,
      });
      return { success: true, message: 'Shared task list imported successfully.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to import shared tasks.';
      set({ isSyncing: false, syncError: message });
      return { success: false, message };
    }
  },
  syncNow: async () => {
    const currentSync = get().sync;
    if (!currentSync) {
      return { success: false, message: 'Create a sync link first to keep tasks available across devices.' };
    }

    set({ isSyncing: true, syncError: null });

    try {
      const res = await fetch(apiUrl(`/api/sync/${currentSync.bucketId}/push`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: get().tasks }),
      });
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res).catch(() => ({ error: 'Unable to sync tasks.' }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const descriptor = await parseJsonResponse<SyncDescriptor>(res);
      set({
        sync: {
          ...descriptor,
          syncCode: buildSyncCode(descriptor.bucketId),
          syncUrl: buildSyncUrl(descriptor.bucketId),
        },
        isSyncing: false,
        syncError: null,
      });
      return { success: true, message: 'Your shared task list is up to date.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sync tasks.';
      set({ isSyncing: false, syncError: message });
      return { success: false, message };
    }
  },
  clearSyncError: () => set({ syncError: null }),
}));
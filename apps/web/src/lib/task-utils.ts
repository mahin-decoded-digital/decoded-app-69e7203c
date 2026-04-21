import type { Task, TaskQueryState } from '@/types/task';

export const LOGO_URL = 'https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/buddy-9ef5fb0a.png';
const SYNC_PREFIX = 'solotasker-sync-v1';

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDate(dateString: string | null, includeTime = false): string {
  if (!dateString) {
    return 'No due date';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

export function getTodayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDueState(task: Task): 'none' | 'upcoming' | 'today' | 'overdue' {
  if (!task.dueDate || task.completed) {
    return 'none';
  }

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) {
    return 'none';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDay.getTime() < today.getTime()) {
    return 'overdue';
  }

  if (dueDay.getTime() === today.getTime()) {
    return 'today';
  }

  return 'upcoming';
}

export function getTaskStatusLabel(task: Task): string {
  return task.completed ? 'Completed' : 'Active';
}

export function sortTasks(tasks: Task[], sortBy: TaskQueryState['sortBy']): Task[] {
  const copied = [...tasks];

  copied.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }

    if (sortBy === 'status') {
      if (a.completed === b.completed) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return Number(a.completed) - Number(b.completed);
    }

    if (sortBy === 'dueDate') {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      if (aTime === bTime) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return aTime - bTime;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return copied;
}

export function filterAndSortTasks(tasks: Task[], query: TaskQueryState): Task[] {
  const normalized = query.search.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    const matchesFilter =
      query.filter === 'all' ||
      (query.filter === 'active' && !task.completed) ||
      (query.filter === 'completed' && task.completed);

    if (!matchesFilter) {
      return false;
    }

    if (!normalized) {
      return true;
    }

    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    return title.includes(normalized) || description.includes(normalized);
  });

  return sortTasks(filtered, query.sortBy);
}

export function buildSyncCode(bucketId: string): string {
  return bucketId.slice(0, 4).toUpperCase();
}

export function buildSyncStorageKey(bucketId: string): string {
  return `${SYNC_PREFIX}:${bucketId}`;
}

export function buildSyncUrl(bucketId: string): string {
  if (typeof window === 'undefined') {
    return `/?sync=${bucketId}`;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('sync', bucketId);
  return url.toString();
}

export function isValidSyncBucketId(input: string): boolean {
  return /^[a-z0-9]{10,24}$/i.test(input.trim());
}

export function extractSyncBucketId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (isValidSyncBucketId(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const syncValue = parsed.searchParams.get('sync');
    return syncValue && isValidSyncBucketId(syncValue) ? syncValue : null;
  } catch {
    return null;
  }
}

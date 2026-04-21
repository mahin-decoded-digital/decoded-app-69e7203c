export type TaskStatusFilter = 'all' | 'active' | 'completed';
export type TaskSortOption = 'dueDate' | 'createdAt' | 'title' | 'status';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  dueDate: string | null;
}

export interface SyncSnapshot {
  version: number;
  bucketId: string;
  updatedAt: string;
  tasks: Task[];
}

export interface SyncDescriptor {
  bucketId: string;
  syncCode: string;
  syncUrl: string;
  lastSyncedAt: string | null;
}

export interface TaskQueryState {
  search: string;
  filter: TaskStatusFilter;
  sortBy: TaskSortOption;
}

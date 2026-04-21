import { Search, SlidersHorizontal, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaskQueryState, TaskStatusFilter } from '@/types/task';

interface TaskToolbarProps {
  query: TaskQueryState;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  selectedCount: number;
  allVisibleSelected: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: TaskStatusFilter) => void;
  onSortChange: (sortBy: TaskQueryState['sortBy']) => void;
  onSelectVisible: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  bulkDeleteDisabled: boolean;
}

const filters: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function TaskToolbar({
  query,
  totalCount,
  activeCount,
  completedCount,
  selectedCount,
  allVisibleSelected,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onSelectVisible,
  onClearSelection,
  onBulkDelete,
  bulkDeleteDisabled,
}: TaskToolbarProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search-tasks">Search tasks</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-tasks"
                    value={query.search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search title or description"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-tasks">Sort by</Label>
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select
                    id="sort-tasks"
                    value={query.sortBy}
                    onChange={(event) => onSortChange(event.target.value as TaskQueryState['sortBy'])}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="dueDate">Due date</option>
                    <option value="createdAt">Creation date</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status filter</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter.value}
                      type="button"
                      variant={query.filter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFilterChange(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge variant="outline">{totalCount} total</Badge>
              <Badge variant="outline">{activeCount} active</Badge>
              <Badge variant="secondary">{completedCount} completed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium">Bulk actions</p>
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected for quick cleanup.` : 'Select tasks to remove several items at once.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSelectVisible}>
              {allVisibleSelected ? 'Refresh selection' : 'Select visible'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelection} disabled={selectedCount === 0}>
              Clear selection
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onBulkDelete} disabled={bulkDeleteDisabled}>
              <Trash className="mr-2 h-4 w-4" />
              Delete selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

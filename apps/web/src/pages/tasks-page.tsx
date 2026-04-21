import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ListChecks, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppShell } from '@/components/layout/app-shell';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { TaskItemCard } from '@/components/tasks/task-item-card';
import { TaskToolbar } from '@/components/tasks/task-toolbar';
import { filterAndSortTasks, getTodayDateInputValue } from '@/lib/task-utils';
import { useTaskStore } from '@/stores/task-store';
import type { Task } from '@/types/task';

export default function TasksPage() {
  const navigate = useNavigate();
  const tasks = useTaskStore((s) => s.tasks);
  const query = useTaskStore((s) => s.query);
  const selectedTaskIds = useTaskStore((s) => s.selectedTaskIds);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const bulkDeleteSelected = useTaskStore((s) => s.bulkDeleteSelected);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const setSearch = useTaskStore((s) => s.setSearch);
  const setFilter = useTaskStore((s) => s.setFilter);
  const setSortBy = useTaskStore((s) => s.setSortBy);
  const toggleTaskSelection = useTaskStore((s) => s.toggleTaskSelection);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const selectVisibleTasks = useTaskStore((s) => s.selectVisibleTasks);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    void fetchTasks();
  }, []);

  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickError, setQuickError] = useState('');
  const [quickPending, setQuickPending] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const visibleTasks = useMemo(() => filterAndSortTasks(tasks, query), [tasks, query]);
  const activeCount = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const allVisibleSelected = visibleTasks.length > 0 && visibleTasks.every((task) => selectedTaskIds.includes(task.id));

  const handleQuickCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = quickTitle.trim();

    if (!normalizedTitle) {
      setQuickError('Task title is required.');
      return;
    }

    setQuickPending(true);
    setQuickError('');
    const result = await createTask({
      title: normalizedTitle,
      description: quickDescription.trim(),
      dueDate: quickDueDate || null,
    });
    setQuickPending(false);

    if (!result.success) {
      setQuickError(result.message ?? 'Unable to create task.');
      return;
    }

    setQuickTitle('');
    setQuickDescription('');
    setQuickDueDate('');
  };

  const handleEditSubmit = async (input: { title: string; description: string; dueDate: string | null }) => {
    if (!editTask) {
      return { success: false, message: 'No task selected for editing.' };
    }

    return updateTask(editTask.id, input);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-primary/15 bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="space-y-4 p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-sm font-medium text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Personal task flow, portable by link
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Stay focused with a single clean task list.</CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Capture tasks fast, scan due dates at a glance, and keep everything synced across devices without creating an account.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-border bg-white px-3 py-1">{tasks.length} total tasks</span>
                <span className="rounded-full border border-border bg-white px-3 py-1">{activeCount} active</span>
                <span className="rounded-full border border-border bg-white px-3 py-1">{completedCount} completed</span>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick create</CardTitle>
              <CardDescription>Add a task in seconds with optional notes and a due date.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-title">Title</Label>
                  <Input
                    id="quick-title"
                    value={quickTitle}
                    onChange={(event) => setQuickTitle(event.target.value)}
                    placeholder="Reply to client email"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-description">Description</Label>
                  <Textarea
                    id="quick-description"
                    value={quickDescription}
                    onChange={(event) => setQuickDescription(event.target.value)}
                    placeholder="Optional details, links, or next steps"
                    rows={4}
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-due-date">Due date</Label>
                  <Input
                    id="quick-due-date"
                    type="date"
                    min={getTodayDateInputValue()}
                    value={quickDueDate}
                    onChange={(event) => setQuickDueDate(event.target.value)}
                  />
                </div>
                {quickError ? <p className="text-sm font-medium text-destructive">{quickError}</p> : null}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={quickPending}>
                    <Plus className="mr-2 h-4 w-4" />
                    {quickPending ? 'Adding...' : 'Add task'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/sync')}>
                    Open sync tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visible tasks</p>
                <p className="text-2xl font-bold">{visibleTasks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-red-100 p-3 text-red-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected for cleanup</p>
                <p className="text-2xl font-bold">{selectedTaskIds.length}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <TaskToolbar
          query={query}
          totalCount={tasks.length}
          activeCount={activeCount}
          completedCount={completedCount}
          selectedCount={selectedTaskIds.length}
          allVisibleSelected={allVisibleSelected}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSortChange={setSortBy}
          onSelectVisible={() => selectVisibleTasks(visibleTasks.map((task) => task.id))}
          onClearSelection={clearSelection}
          onBulkDelete={() => setBulkConfirmOpen(true)}
          bulkDeleteDisabled={selectedTaskIds.length === 0}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Task list</h2>
              <p className="text-sm text-muted-foreground">Titles, due dates, status, and creation times stay visible for fast scanning.</p>
            </div>
          </div>

          {visibleTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <ListChecks className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-lg font-semibold">No tasks match your current view</p>
                  <p className="text-sm text-muted-foreground">
                    Try clearing your search, switching filters, or adding your next task above.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visibleTasks.map((task) => (
                <TaskItemCard
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelect={toggleTaskSelection}
                  onToggleComplete={toggleTaskCompletion}
                  onEdit={(currentTask) => {
                    setEditTask(currentTask);
                    setEditOpen(true);
                  }}
                  onDelete={(id) => {
                    void deleteTask(id);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={editTask} onSubmit={handleEditSubmit} />

      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected tasks</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedTaskIds.length} selected task{selectedTaskIds.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                void bulkDeleteSelected();
                setBulkConfirmOpen(false);
              }}
            >
              Delete selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
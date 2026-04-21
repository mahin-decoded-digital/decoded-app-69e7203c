import { useState } from 'react';
import { Calendar, CheckCircle, Circle, Edit, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatDate, getDueState, getTaskStatusLabel } from '@/lib/task-utils';
import type { Task } from '@/types/task';

interface TaskItemCardProps {
  task: Task;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItemCard({ task, selected, onSelect, onToggleComplete, onEdit, onDelete }: TaskItemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dueState = getDueState(task);

  const dueBadge =
    dueState === 'overdue'
      ? { label: 'Overdue', className: 'border-red-200 bg-red-50 text-red-700' }
      : dueState === 'today'
        ? { label: 'Due today', className: 'border-amber-200 bg-amber-50 text-amber-700' }
        : dueState === 'upcoming'
          ? { label: 'Upcoming', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
          : null;

  return (
    <Card className={cn('transition-all', selected && 'ring-2 ring-primary/30')}>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <input
            aria-label={`Select ${task.title}`}
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(task.id)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className={cn('text-lg', task.completed && 'text-muted-foreground line-through')}>
                {task.title}
              </CardTitle>
              <Badge variant={task.completed ? 'secondary' : 'outline'}>{getTaskStatusLabel(task)}</Badge>
              {dueBadge ? <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', dueBadge.className)}>{dueBadge.label}</span> : null}
            </div>
            <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {task.description || 'No description added yet.'}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete task</DialogTitle>
                <DialogDescription>
                  This will permanently remove "{task.title}" from your shared task list.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDelete(task.id);
                    setConfirmOpen(false);
                  }}
                >
                  Delete task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due {formatDate(task.dueDate)}
          </span>
          <span>Created {formatDate(task.createdAt, true)}</span>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t border-border/70 pt-4">
        <p className="text-xs text-muted-foreground">Updated {formatDate(task.updatedAt, true)}</p>
        <Button variant={task.completed ? 'secondary' : 'default'} size="sm" onClick={() => onToggleComplete(task.id)}>
          {task.completed ? <Circle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {task.completed ? 'Mark active' : 'Mark complete'}
        </Button>
      </CardFooter>
    </Card>
  );
}

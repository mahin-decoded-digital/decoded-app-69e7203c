import { useEffect } from 'react';
import { Link2, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { SyncPanel } from '@/components/tasks/sync-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/task-utils';
import { useTaskStore } from '@/stores/task-store';

export default function SyncPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const syncParam = searchParams.get('sync');
  const tasks = useTaskStore((s) => s.tasks);
  const sync = useTaskStore((s) => s.sync);
  const isSyncing = useTaskStore((s) => s.isSyncing);
  const syncError = useTaskStore((s) => s.syncError);
  const createSyncLink = useTaskStore((s) => s.createSyncLink);
  const importFromSyncInput = useTaskStore((s) => s.importFromSyncInput);
  const syncNow = useTaskStore((s) => s.syncNow);
  const clearSyncError = useTaskStore((s) => s.clearSyncError);

  useEffect(() => {
    if (!syncParam) {
      return;
    }

    void importFromSyncInput(syncParam).then(() => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('sync');
      setSearchParams(nextParams, { replace: true });
    });
  }, [syncParam]);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-primary/15 bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">Privacy-first sync</Badge>
                <Badge variant="outline">No account required</Badge>
              </div>
              <CardTitle className="text-3xl font-bold">Move your task list between devices with one private link.</CardTitle>
              <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Upload your current tasks, copy the generated link, and paste it into another browser whenever you need the same workspace.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col justify-center gap-5 p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Shareable sync buckets</p>
                  <p className="text-sm text-muted-foreground">Each link points to a simple shared snapshot of your tasks.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Minimal personal footprint</p>
                  <p className="text-sm text-muted-foreground">No login, no password, and no profile setup standing between you and your list.</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                {sync
                  ? `Connected to bucket ${sync.bucketId}. Last synced ${sync.lastSyncedAt ? formatDate(sync.lastSyncedAt, true) : 'not yet recorded'}.`
                  : 'Create a sync link below to start keeping your tasks portable.'}
              </div>
            </CardContent>
          </Card>
        </section>

        <SyncPanel
          sync={sync}
          isSyncing={isSyncing}
          syncError={syncError}
          taskCount={tasks.length}
          onCreateLink={createSyncLink}
          onImport={importFromSyncInput}
          onSyncNow={syncNow}
          onClearError={clearSyncError}
        />
      </div>
    </AppShell>
  );
}
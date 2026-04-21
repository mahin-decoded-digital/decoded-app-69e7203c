import { useState } from 'react';
import { CheckCircle, Copy, Download, Link2, LoaderCircle, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/task-utils';
import type { SyncDescriptor } from '@/types/task';

interface SyncPanelProps {
  sync: SyncDescriptor | null;
  isSyncing: boolean;
  syncError: string | null;
  taskCount: number;
  onCreateLink: () => Promise<{ success: boolean; message: string }>;
  onImport: (value: string) => Promise<{ success: boolean; message: string }>;
  onSyncNow: () => Promise<{ success: boolean; message: string }>;
  onClearError: () => void;
}

export function SyncPanel({
  sync,
  isSyncing,
  syncError,
  taskCount,
  onCreateLink,
  onImport,
  onSyncNow,
  onClearError,
}: SyncPanelProps) {
  const [importValue, setImportValue] = useState('');
  const [message, setMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCreate = async () => {
    setMessage('');
    onClearError();
    setIsCreating(true);
    const result = await onCreateLink();
    setIsCreating(false);
    setMessage(result.message);
  };

  const handleImport = async () => {
    if (!importValue.trim()) {
      setMessage('Paste a sync link or bucket id to import tasks.');
      return;
    }

    setMessage('');
    onClearError();
    setIsImporting(true);
    const result = await onImport(importValue);
    setIsImporting(false);
    setMessage(result.message);
  };

  const handleSyncNow = async () => {
    setMessage('');
    onClearError();
    const result = await onSyncNow();
    setMessage(result.message);
  };

  const handleCopy = async () => {
    if (!sync?.syncUrl) {
      return;
    }

    setIsCopying(true);
    await navigator.clipboard.writeText(sync.syncUrl);
    setIsCopying(false);
    setMessage('Sync link copied. Open it on another device to load this list.');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sync by private link</CardTitle>
          <CardDescription>
            SoloTasker keeps your tasks portable without accounts. Upload your current list, then open the link elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Current shared workspace</p>
                <p className="text-sm text-muted-foreground">
                  {sync ? `Bucket ${sync.bucketId} · ${taskCount} tasks available` : 'No sync link created yet'}
                </p>
              </div>
              {sync ? <Badge>Code {sync.syncCode}</Badge> : <Badge variant="outline">Not connected</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreate} disabled={isCreating || isSyncing}>
              {isCreating || isSyncing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {sync ? 'Refresh sync link' : 'Create sync link'}
            </Button>
            <Button variant="outline" onClick={handleSyncNow} disabled={!sync || isSyncing}>
              {isSyncing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Sync current tasks now
            </Button>
            <Button variant="secondary" onClick={handleCopy} disabled={!sync || isCopying}>
              <Copy className="mr-2 h-4 w-4" />
              {isCopying ? 'Copying...' : 'Copy link'}
            </Button>
          </div>

          {sync ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div>
                <Label htmlFor="sync-url">Shareable sync URL</Label>
                <Input id="sync-url" readOnly value={sync.syncUrl} className="mt-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                Last synced {sync.lastSyncedAt ? formatDate(sync.lastSyncedAt, true) : 'Never'}
              </p>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-3">
            <div>
              <Label htmlFor="import-sync">Open an existing sync link</Label>
              <Input
                id="import-sync"
                value={importValue}
                onChange={(event) => setImportValue(event.target.value)}
                placeholder="Paste a sync URL or bucket id"
                className="mt-2"
              />
            </div>
            <Button variant="outline" onClick={handleImport} disabled={isImporting || isSyncing}>
              {isImporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Import shared tasks
            </Button>
          </div>

          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4" />
                <span>{message}</span>
              </div>
            </div>
          ) : null}

          {syncError ? <p className="text-sm font-medium text-destructive">{syncError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Privacy-first syncing in three lightweight steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium text-foreground">1. Upload your current list</p>
            <p className="mt-1">Create a sync link to store your current tasks in a private shared bucket.</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium text-foreground">2. Open the link elsewhere</p>
            <p className="mt-1">Paste the link or code on another device and import the exact same task set.</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium text-foreground">3. Sync after changes</p>
            <p className="mt-1">Whenever you add or update tasks, SoloTasker can refresh the shared snapshot so it stays current.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

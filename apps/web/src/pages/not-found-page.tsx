import { Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center py-8">
        <Card className="max-w-2xl border-primary/10 bg-gradient-to-br from-white to-orange-50 shadow-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-4 text-primary">
              <Search className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Page not found</CardTitle>
              <CardDescription className="text-base leading-7">
                The page you requested does not exist in SoloTasker. Your tasks are still safe — this route just is not part of the current workspace.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-8 pt-0">
            <div className="rounded-xl border border-border bg-background p-5 text-left">
              <p className="text-sm font-semibold text-foreground">Where to go next</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>• Return to the main task board to create, edit, complete, or delete tasks.</li>
                <li>• Open Sync to generate a portable link or import tasks from another device.</li>
                <li>• Use the top navigation to move between the two core SoloTasker tools.</li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to tasks
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/sync">Open sync tools</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { Loader2 } from 'lucide-react';

export default function InvitationsLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-us-ivory">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-us-accent" aria-hidden="true" />
        <p className="font-body text-sm text-us-ink-muted">Загрузка...</p>
      </div>
    </div>
  );
}

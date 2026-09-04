import { Toaster } from 'shaqyru-ui';

// Toaster's own `children` prop is accepted but never rendered by the
// component (apps/web/src/components/ui/toaster.tsx) — there is no way to
// seed a visible toast from outside; mounting it standalone is honestly an
// empty top-right viewport until an app-level `useToast().toast(...)` call
// fires. See the real toast bubble on the Toast component's own preview.
export const Mounted = () => <Toaster />;

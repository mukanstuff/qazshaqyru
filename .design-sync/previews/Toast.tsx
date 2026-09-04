import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from 'shaqyru-ui';

export const Default = () => (
  <ToastProvider duration={100000}>
    <Toast open style={{ position: 'static' }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <ToastTitle>Invitation published</ToastTitle>
        <ToastDescription>Your guests can now view it at the shared link.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
    <ToastViewport style={{ position: 'static' }} />
  </ToastProvider>
);

export const Destructive = () => (
  <ToastProvider duration={100000}>
    <Toast open variant="destructive" style={{ position: 'static' }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <ToastTitle>Payment failed</ToastTitle>
        <ToastDescription>Please check your card details and try again.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
    <ToastViewport style={{ position: 'static' }} />
  </ToastProvider>
);

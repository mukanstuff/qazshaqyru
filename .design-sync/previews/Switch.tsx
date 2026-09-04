import { Switch, Label } from 'shaqyru-ui';

export const States = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id="email-notify" defaultChecked />
      <Label htmlFor="email-notify">Email notifications</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id="sms-notify" />
      <Label htmlFor="sms-notify">SMS notifications</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id="locked" disabled />
      <Label htmlFor="locked">Locked setting</Label>
    </div>
  </div>
);

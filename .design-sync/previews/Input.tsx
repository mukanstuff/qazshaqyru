import { Input, Label } from 'shaqyru-ui';

export const Default = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 260 }}>
    <Label htmlFor="guest-name">Guest name</Label>
    <Input id="guest-name" placeholder="e.g. Aigerim Bekova" />
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 260 }}>
    <Input placeholder="Empty" />
    <Input defaultValue="Filled value" />
    <Input placeholder="Disabled" disabled />
  </div>
);

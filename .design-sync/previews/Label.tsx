import { Label, Input } from 'shaqyru-ui';

export const Default = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 240 }}>
    <Label htmlFor="event-date">Event date</Label>
    <Input id="event-date" type="date" />
  </div>
);

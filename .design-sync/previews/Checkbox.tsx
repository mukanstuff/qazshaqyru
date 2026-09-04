import { Checkbox, Label } from 'shaqyru-ui';

export const States = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="rsvp" />
      <Label htmlFor="rsvp">Send RSVP reminder</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="rsvp-checked" defaultChecked />
      <Label htmlFor="rsvp-checked">Allow plus-ones</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="rsvp-disabled" disabled />
      <Label htmlFor="rsvp-disabled">Locked field</Label>
    </div>
  </div>
);

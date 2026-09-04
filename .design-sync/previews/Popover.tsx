import { Popover, PopoverTrigger, PopoverContent, Button } from 'shaqyru-ui';

export const Open = () => (
  <Popover defaultOpen>
    <PopoverTrigger asChild>
      <Button variant="outline">Share invitation</Button>
    </PopoverTrigger>
    <PopoverContent>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Share link</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--us-ink-muted)' }}>
        Anyone with this link can view the invitation.
      </p>
    </PopoverContent>
  </Popover>
);

import { Button } from 'shaqyru-ui';

export const Variants = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="default">Continue</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="ghost">Skip</Button>
    <Button variant="destructive">Delete invitation</Button>
    <Button variant="link">Learn more</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Add">+</Button>
  </div>
);

export const Brand = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button variant="turquoise">Publish</Button>
    <Button variant="peach">Upgrade</Button>
    <Button variant="gradient">Get started</Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Button>Default</Button>
    <Button disabled>Disabled</Button>
  </div>
);

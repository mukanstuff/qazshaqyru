import { Badge } from 'shaqyru-ui';

export const Statuses = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <Badge variant="default">New</Badge>
    <Badge variant="draft">Draft</Badge>
    <Badge variant="published">Published</Badge>
    <Badge variant="archived">Archived</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

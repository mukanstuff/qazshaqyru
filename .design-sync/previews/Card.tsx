import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'shaqyru-ui';

export const InvitationCard = () => (
  <Card style={{ maxWidth: 360 }}>
    <CardHeader>
      <CardTitle>Aida &amp; Yerlan</CardTitle>
      <CardDescription>Wedding invitation · Aug 30, 2026</CardDescription>
    </CardHeader>
    <CardContent>
      <p style={{ fontSize: 14, color: 'var(--us-ink-muted)', margin: 0 }}>
        128 guests invited · 96 confirmed
      </p>
    </CardContent>
    <CardFooter>
      <Button size="sm">Open editor</Button>
    </CardFooter>
  </Card>
);

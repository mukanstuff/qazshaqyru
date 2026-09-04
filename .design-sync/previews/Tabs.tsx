import { Tabs, TabsList, TabsTrigger, TabsContent } from 'shaqyru-ui';

export const Default = () => (
  <Tabs defaultValue="guests" style={{ width: 320 }}>
    <TabsList>
      <TabsTrigger value="guests">Guests</TabsTrigger>
      <TabsTrigger value="design">Design</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="guests" style={{ paddingTop: 12, fontSize: 14, color: 'var(--us-ink-muted)' }}>
      128 guests · 96 confirmed
    </TabsContent>
    <TabsContent value="design" style={{ paddingTop: 12, fontSize: 14, color: 'var(--us-ink-muted)' }}>
      Wedding · Turquoise theme
    </TabsContent>
    <TabsContent value="settings" style={{ paddingTop: 12, fontSize: 14, color: 'var(--us-ink-muted)' }}>
      Public link enabled
    </TabsContent>
  </Tabs>
);

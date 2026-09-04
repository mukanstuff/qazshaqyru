import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetCloseButton, Button } from 'shaqyru-ui';

export const Open = () => (
  <Sheet defaultOpen>
    <SheetContent side="bottom" draggable={false}>
      <SheetHeader>
        <SheetTitle>Guest details</SheetTitle>
        <SheetCloseButton />
      </SheetHeader>
      <SheetBody>
        <SheetDescription>
          Aigerim Bekova · 2 guests · RSVP confirmed
        </SheetDescription>
        <div style={{ marginTop: 16 }}>
          <Button size="sm">Edit guest</Button>
        </div>
      </SheetBody>
    </SheetContent>
  </Sheet>
);

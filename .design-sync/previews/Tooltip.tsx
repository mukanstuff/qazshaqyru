import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button } from 'shaqyru-ui';

export const Open = () => (
  <TooltipProvider>
    <Tooltip defaultOpen open>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Info">i</Button>
      </TooltipTrigger>
      <TooltipContent>Only visible to you</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

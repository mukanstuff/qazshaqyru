import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from 'shaqyru-ui';

export const Open = () => (
  <Select defaultOpen defaultValue="wedding">
    <SelectTrigger style={{ width: 220 }}>
      <SelectValue placeholder="Choose a template" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Templates</SelectLabel>
        <SelectItem value="wedding">Wedding</SelectItem>
        <SelectItem value="birthday">Birthday</SelectItem>
        <SelectItem value="anniversary">Anniversary</SelectItem>
        <SelectItem value="corporate">Corporate event</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

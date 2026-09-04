import { Slider } from 'shaqyru-ui';

export const Default = () => (
  <div style={{ width: 260 }}>
    <Slider defaultValue={[40]} max={100} step={1} />
  </div>
);

export const Range = () => (
  <div style={{ width: 260 }}>
    <Slider defaultValue={[20, 70]} max={100} step={1} />
  </div>
);

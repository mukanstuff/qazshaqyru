import { describe, it, expect } from 'vitest';
import { RsvpFormElementView } from '../RsvpFormElementView';
import { WishesElementView } from '../WishesElementView';
import { MapElementView } from '../MapElementView';
import { MusicPlayerElementView } from '../MusicPlayerElementView';
import { GiftBlockElementView } from '../GiftBlockElementView';
import { QrCodeElementView } from '../QrCodeElementView';
import { ProgramElementView } from '../ProgramElementView';
import { OrnamentElementView } from '../OrnamentElementView';
import { LottieElementView } from '../LottieElementView';
import { VideoBgElementView } from '../VideoBgElementView';
import type {
  ProgramElement,
  OrnamentElement,
  VideoBgElement,
} from '@/lib/canvas/types';

describe('Functional element views', () => {
  it('exports valid component functions for all functional element types', () => {
    expect(typeof RsvpFormElementView).toBe('function');
    expect(typeof WishesElementView).toBe('function');
    expect(typeof MapElementView).toBe('function');
    expect(typeof MusicPlayerElementView).toBe('function');
    expect(typeof GiftBlockElementView).toBe('function');
    expect(typeof QrCodeElementView).toBe('function');
    expect(typeof ProgramElementView).toBe('function');
    expect(typeof OrnamentElementView).toBe('function');
    expect(typeof LottieElementView).toBe('function');
    expect(typeof VideoBgElementView).toBe('function');
  });

  it('renders stateless views without React hook context', () => {
    const programEl: ProgramElement = {
      id: 'prog-1',
      type: 'program',
      x: 0,
      y: 0,
      w: 80,
      h: 'auto',
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      items: [{ id: 'item-1', time: '18:00', title: 'Начало' }],
      fontFamily: 'Montserrat',
      bgColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#c9a961',
    };
    const progNode = ProgramElementView({ el: programEl });
    expect(progNode).toBeDefined();
    expect(progNode.props.style.width).toBe('100%');

    const ornamentEl: OrnamentElement = {
      id: 'orn-1',
      type: 'ornament',
      ornamentId: 'oy-1',
      x: 0,
      y: 0,
      w: 80,
      h: 80,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
    };
    const ornNode = OrnamentElementView({ el: ornamentEl });
    expect(ornNode).toBeDefined();

    const videoEl: VideoBgElement = {
      id: 'vid-1',
      type: 'video-bg',
      src: '',
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
    };
    const vidNode = VideoBgElementView({ el: videoEl });
    expect(vidNode).toBeDefined();
  });
});

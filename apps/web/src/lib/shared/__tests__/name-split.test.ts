import { describe, it, expect } from 'vitest';
import { splitCoupleNames, namesToGroomBride } from '../name-split';

describe('splitCoupleNames', () => {
  it('splits on & with whitespace', () => {
    expect(splitCoupleNames('Иван & Мария')).toEqual(['Иван', 'Мария']);
    expect(splitCoupleNames('JOHN & JANE')).toEqual(['JOHN', 'JANE']);
  });

  it('splits on Cyrillic "и" with surrounding whitespace', () => {
    expect(splitCoupleNames('Иван и Мария')).toEqual(['Иван', 'Мария']);
    expect(splitCoupleNames('Иван  и  Мария')).toEqual(['Иван', 'Мария']);
  });

  it('splits on Kazakh "және"', () => {
    expect(splitCoupleNames('Айгерим және Арлан')).toEqual(['Айгерим', 'Арлан']);
  });

  it('does NOT split inside names with И/А letters', () => {
    // Bug case: regex /&|и|және/i splits "Иван & Мария" into ["", "ван ", " Мария"]
    // because "И" (case-insensitive) matches inside "Иван".
    expect(splitCoupleNames('Ив&ан')).toEqual(['Ив', 'ан']);
    expect(splitCoupleNames('Айгерим')).toEqual(['Айгерим']);
  });

  it('handles single names and empty input', () => {
    expect(splitCoupleNames('Иван')).toEqual(['Иван']);
    expect(splitCoupleNames('')).toEqual([]);
    expect(splitCoupleNames('   ')).toEqual([]);
  });

  it('does NOT split on hyphens or other punctuation', () => {
    expect(splitCoupleNames('Иван-Мария')).toEqual(['Иван-Мария']);
  });
});

describe('namesToGroomBride', () => {
  it('produces groomName + brideName from & separator', () => {
    expect(namesToGroomBride('Иван & Мария')).toEqual({
      groomName: 'Иван',
      brideName: 'Мария',
    });
  });

  it('produces groomName + brideName from Cyrillic и', () => {
    expect(namesToGroomBride('Иван и Мария')).toEqual({
      groomName: 'Иван',
      brideName: 'Мария',
    });
  });

  it('produces only groomName when no separator present', () => {
    expect(namesToGroomBride('Иван')).toEqual({ groomName: 'Иван' });
  });

  it('returns empty object for empty input', () => {
    expect(namesToGroomBride('')).toEqual({});
    expect(namesToGroomBride('   ')).toEqual({});
  });
});
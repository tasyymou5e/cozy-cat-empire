import { describe, it, expect } from 'vitest';
import { getRelationshipLabel, getRelationshipColor } from '../relationshipUtils';

describe('relationshipUtils', () => {
  it('getRelationshipLabel should return label for positive score', () => {
    const label = getRelationshipLabel(80);
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it('getRelationshipLabel should return label for negative score', () => {
    const label = getRelationshipLabel(-50);
    expect(typeof label).toBe('string');
  });

  it('getRelationshipColor should return a valid color class', () => {
    const color = getRelationshipColor(50);
    expect(typeof color).toBe('string');
  });
});

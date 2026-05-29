import { describe, it, expect } from 'vitest';
import type { BBox, DocumentExtractorResult } from '../src/interfaces';

describe('Core Interfaces', () => {
  it('should allow creating a BBox object', () => {
    const box: BBox = { x: 0, y: 0, width: 100, height: 100 };
    expect(box.width).toBe(100);
  });

  it('should allow creating a DocumentExtractorResult object', () => {
    const result: DocumentExtractorResult = {
      rawText: ['Hello'],
      confidence: 0.9,
      isBlurred: false
    };
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});

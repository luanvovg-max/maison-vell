import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrap,
  clamp,
  computeModelLayout,
  computeCardPosition,
  computeRollOffset,
  KX,
  KF,
  KH,
  KB,
  KO,
} from './depth-math.ts';

test('wrap function handles positive and negative values correctly', () => {
  assert.equal(wrap(0, 6), 0);
  assert.equal(wrap(6, 6), 0);
  assert.equal(wrap(7, 6), 1);
  assert.equal(wrap(-1, 6), 5);
  assert.equal(wrap(-7, 6), 5);
});

test('clamp restricts numbers within bounds', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test('depth stops are defined from -1 to 5 (7 values each)', () => {
  assert.equal(KX.length, 7);
  assert.equal(KF.length, 7);
  assert.equal(KH.length, 7);
  assert.equal(KB.length, 7);
  assert.equal(KO.length, 7);
});

test('computeModelLayout at p=0 for model 0 (front model, depth 0)', () => {
  const stageW = 1000;
  const stageH = 800;
  const baseHeight = stageH * 1.2;
  const aspectRatio = 164 / 448; // first model ratio

  const layout = computeModelLayout(0, 0, 6, aspectRatio, stageW, stageH, baseHeight);

  // depth for model 0 at p=0 should be 0
  assert.equal(layout.d, 0);
  // depth 0 index in table is stop index 1: KH[1] = 0.832
  const expectedH = 0.832 * stageH;
  const expectedScale = expectedH / baseHeight;
  assert.ok(Math.abs(layout.scale - expectedScale) < 1e-6);

  // opacity at depth 0 is KO[1] = 1.0
  assert.equal(layout.opacity, 1);
  // blur at depth 0 is KB[1] = 0
  assert.equal(layout.blur, 0);
  // zIndex at depth 0 is 100 - 0 = 100
  assert.equal(layout.zIndex, 100);
});

test('computeModelLayout at p=0 for model 5 (depth 5, hazy distance)', () => {
  const stageW = 1000;
  const stageH = 800;
  const baseHeight = stageH * 1.2;
  const aspectRatio = 164 / 448;

  const layout = computeModelLayout(5, 0, 6, aspectRatio, stageW, stageH, baseHeight);

  // d is 5
  assert.equal(layout.d, 5);
  // opacity at depth 5 is KO[6] = 0
  assert.equal(layout.opacity, 0);
  // zIndex at depth 5 is 100 - 50 = 50
  assert.equal(layout.zIndex, 50);
});

test('computeCardPosition wraps 12 cards cleanly across the track', () => {
  const cardSize = 250;
  const totalCards = 12;
  const all = cardSize * totalCards;

  // At p=0, card 0 is at y=0
  assert.equal(computeCardPosition(0, 0, cardSize, totalCards), 0);
  // At p=1, card 2 is at y=0 (so next look's first piece is at top)
  assert.equal(computeCardPosition(2, 1, cardSize, totalCards), 0);
  // Card 11 at p=0: 11 * 250 = 2750. Since 2750 is not > 2750, it is 2750.
  // When p moves slightly forward, e.g. p=0.1:
  // card 0 is wrap(-50, 3000) = 2950. 2950 > 2750 -> 2950 - 3000 = -50 (smoothly enters from above)
  assert.equal(computeCardPosition(0, 0.1, cardSize, totalCards), -50);
});

test('computeRollOffset calculates correct translation for rolling look number', () => {
  const lineHeight = 38;
  assert.equal(Math.abs(computeRollOffset(0, 6, lineHeight)), 0);
  assert.equal(computeRollOffset(1, 6, lineHeight), -38);
  assert.equal(computeRollOffset(5.5, 6, lineHeight), -5.5 * 38);
  assert.equal(Math.abs(computeRollOffset(6, 6, lineHeight)), 0); // wraps
});

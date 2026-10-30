import { cleanData } from './cleanData.js';
import assert from 'assert';

console.log('Running cleanData unit test...');

// Requirement 5 test case:
// A sample dataset with 2 poisoned rows and 3 duplicate copies of one row
// should return the poisoned rows removed and exactly 1 copy of the duplicate kept.
const sampleDataset = [
  // 3 duplicate copies of row A
  { feature_1: 1.5, feature_2: 2.0, label: 1 }, // Copy 1 (original to keep)
  { feature_1: 1.5, feature_2: 2.0, label: 1 }, // Copy 2 (duplicate to delete)
  { feature_1: 1.5, feature_2: 2.0, label: 1 }, // Copy 3 (duplicate to delete)
  
  // 1 clean distinct row B
  { feature_1: 3.0, feature_2: 4.0, label: 0 },
  
  // 2 poisoned rows
  { feature_1: 99.9, feature_2: -88.8, label: 1, isPoisoned: true }, // Poisoned row 1
  { feature_1: -100.0, feature_2: 50.0, label: 0, poison_score: 0.95 } // Poisoned row 2
];

console.log('Input rows count:', sampleDataset.length);
assert.strictEqual(sampleDataset.length, 6, 'Should have 6 input rows');

// Execute cleanData
const { cleaned, stats } = cleanData(sampleDataset);

console.log('Cleaning stats:', stats);
console.log('Cleaned rows count:', cleaned.length);

// Assertions:
// 1. Stats check
assert.strictEqual(stats.totalBefore, 6, 'totalBefore should be 6');
assert.strictEqual(stats.poisonedRemoved, 2, 'poisonedRemoved should be 2');
assert.strictEqual(stats.duplicatesRemoved, 2, 'duplicatesRemoved should be 2 (from 3 copies, 2 extra deleted)');
assert.strictEqual(stats.totalAfter, 2, 'totalAfter should be 2 (1 copy of Row A + Row B)');

// 2. Cleaned data check
assert.strictEqual(cleaned.length, 2, 'Cleaned dataset should have exactly 2 rows');

// Row 0 should be Clean Row A
assert.strictEqual(cleaned[0].feature_1, 1.5);
assert.strictEqual(cleaned[0].feature_2, 2.0);
assert.strictEqual(cleaned[0].label, 1);
assert.strictEqual(cleaned[0]._index, 0);

// Row 1 should be Clean Row B
assert.strictEqual(cleaned[1].feature_1, 3.0);
assert.strictEqual(cleaned[1].feature_2, 4.0);
assert.strictEqual(cleaned[1].label, 0);
assert.strictEqual(cleaned[1]._index, 1);

// Ensure original input was not mutated
assert.strictEqual(sampleDataset.length, 6, 'Original dataset must remain untouched');
assert.strictEqual(sampleDataset[4].isPoisoned, true, 'Original poisoned row exists in original dataset');

console.log('✓ Test 1 passed: 2 poisoned rows removed, 3 duplicate copies reduced to exactly 1 copy kept.');

// Test 2: Verify that suspicious rows (score 0.3 - 0.7 or isSuspicious) are NOT deleted!
console.log('\nRunning Test 2: Verify suspicious data retention...');
const datasetWithSuspicious = [
  // 1 clean row
  { id: 1, val: 10, label: 0 },
  // 1 suspicious row (score 0.45) - MUST NOT BE DELETED!
  { id: 2, val: 25, label: 0, poison_score: 0.45, isSuspicious: true },
  // 1 poisoned row (score 0.92) - MUST BE DELETED!
  { id: 3, val: 999, label: 1, poison_score: 0.92, isPoisoned: true },
  // 2 duplicate copies of row 4
  { id: 4, val: 50, label: 1 },
  { id: 4, val: 50, label: 1 }
];

const res2 = cleanData(datasetWithSuspicious);
console.log('Test 2 stats:', res2.stats);

assert.strictEqual(res2.stats.totalBefore, 5);
assert.strictEqual(res2.stats.poisonedRemoved, 1, 'Only 1 poisoned row should be removed');
assert.strictEqual(res2.stats.suspiciousRetained, 1, '1 suspicious row should be safely retained');
assert.strictEqual(res2.stats.duplicatesRemoved, 1, '1 duplicate copy should be removed');
assert.strictEqual(res2.stats.totalAfter, 3, 'Total after should be 3 (clean + suspicious + 1 copy of duplicate)');

// Verify suspicious row exists in cleaned output
const hasSuspicious = res2.cleaned.some(r => r.id === 2 && r.poison_score === 0.45);
assert.strictEqual(hasSuspicious, true, 'Suspicious row must be preserved in cleaned dataset');

// Verify poisoned row is gone
const hasPoisoned = res2.cleaned.some(r => r.id === 3);
assert.strictEqual(hasPoisoned, false, 'Poisoned row must be removed');

console.log('✓ Test 2 passed: Suspicious data safely retained, poisoned data purged, duplicates deduplicated.');


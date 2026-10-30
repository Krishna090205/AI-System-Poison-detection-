/**
 * Reusable data cleaning pipeline function.
 *
 * Pipeline requirements:
 * 1. Operates on a copy of the dataset (never mutates original in place).
 * 2. Step A - Remove poisoned rows ONLY:
 *    - Poisoned rows (poison score >= 0.7 or isPoisoned flag) are dropped.
 *    - Suspicious rows (score 0.3 - 0.7 or isSuspicious flag) are SAFELY RETAINED (not deleted).
 * 3. Step B - Remove duplicate rows on remaining rows (clean + suspicious):
 *    - Keeps exactly ONE copy (first occurrence).
 *    - Deletes extra redundant duplicate copies.
 *    - The original must never be deleted.
 * 4. Step C - Resets the index and returns { cleaned, stats }.
 *
 * @param {Array<Object>} dataset - Array of row objects.
 * @param {Object} [options]
 * @param {Set<number>|Array<number>|Function} [options.flaggedRows] - Indices or predicate for poisoned rows.
 * @param {number} [options.poisonThreshold=0.7] - Poison score threshold to flag rows (default 0.7; do not delete suspicious rows < 0.7).
 * @param {boolean} [options.removeSuspicious=false] - Whether to remove suspicious rows (default false: keep suspicious data).
 * @returns {{ cleaned: Array<Object>, stats: { totalBefore: number, poisonedRemoved: number, suspiciousRetained: number, duplicatesRemoved: number, totalAfter: number } }}
 */
export function cleanData(dataset, options = {}) {
  if (!Array.isArray(dataset)) {
    throw new Error('Dataset must be an array of row objects');
  }

  // Safety rule: Never mutate original in place. Deep-copy rows.
  const datasetCopy = dataset.map(row => ({ ...row }));
  const totalBefore = datasetCopy.length;

  const { flaggedRows, poisonThreshold = 0.7, removeSuspicious = false } = options;

  // Step A: Remove poisoned rows only (do NOT delete suspicious data)
  const stepAClean = [];
  let poisonedRemoved = 0;
  let suspiciousRetained = 0;

  for (let i = 0; i < datasetCopy.length; i++) {
    const row = datasetCopy[i];
    let isPoisoned = false;
    let isSuspicious = false;

    if (typeof flaggedRows === 'function') {
      isPoisoned = Boolean(flaggedRows(row, i));
    } else if (flaggedRows instanceof Set) {
      isPoisoned = flaggedRows.has(i) || (row._rowId !== undefined && flaggedRows.has(row._rowId));
    } else if (Array.isArray(flaggedRows)) {
      isPoisoned = flaggedRows.includes(i) || (row._rowId !== undefined && flaggedRows.includes(row._rowId));
    } else {
      if (typeof row.poison_score === 'number') {
        if (row.poison_score >= poisonThreshold || row.isPoisoned) {
          isPoisoned = true;
        } else if (row.poison_score >= 0.3) {
          isSuspicious = true;
        }
      } else if (row.isPoisoned) {
        isPoisoned = true;
      } else if (row.isSuspicious) {
        isSuspicious = true;
      }
    }

    // Only remove suspicious if explicitly requested; by default retain suspicious data!
    if (removeSuspicious && isSuspicious) {
      isPoisoned = true;
    }

    if (isPoisoned) {
      poisonedRemoved++;
    } else {
      if (isSuspicious) {
        suspiciousRetained++;
      }
      stepAClean.push(row);
    }
  }

  // Step B: Remove duplicate rows
  // On the remaining rows, find rows that are fully identical.
  // Keep exactly ONE copy of each (first occurrence) and delete the extra copies.
  // The original must never be deleted.
  const seenSignatures = new Set();
  const stepBClean = [];
  let duplicatesRemoved = 0;

  for (let i = 0; i < stepAClean.length; i++) {
    const row = stepAClean[i];

    // Build deterministic content signature (ignore metadata keys like _index, _rowId, etc.)
    const contentKeys = Object.keys(row)
      .filter(key => !key.startsWith('_'))
      .sort();

    const signature = contentKeys.map(k => `${k}:::${JSON.stringify(row[k])}`).join('|||');

    if (seenSignatures.has(signature)) {
      // Extra redundant copy -> delete
      duplicatesRemoved++;
    } else {
      // First occurrence -> keep original
      seenSignatures.add(signature);
      stepBClean.push(row);
    }
  }

  // Step C: Reset the index and return the cleaned dataset
  const cleaned = stepBClean.map((row, idx) => ({
    ...row,
    _index: idx
  }));

  const totalAfter = cleaned.length;

  const stats = {
    totalBefore,
    poisonedRemoved,
    suspiciousRetained,
    duplicatesRemoved,
    totalAfter
  };

  return { cleaned, stats };
}

/**
 * Simple client-side CSV parser to turn CSV text into an array of row objects
 */
export function parseCsvText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row = { _rowId: i - 1 };

    headers.forEach((h, colIdx) => {
      const val = values[colIdx];
      const num = Number(val);
      row[h] = !isNaN(num) && val !== '' ? num : val;
    });

    rows.push(row);
  }

  return rows;
}


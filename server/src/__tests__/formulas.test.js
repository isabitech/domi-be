import {
  computeCbTotal1,
  computeCbTotal2,
  computeOnlineCIH,
  computeTSO,
  computeCurrentLoanBalance,
  computeCurrentSavings,
  computeDisbursementRoll
} from '../utils/formulas.js';

describe('financial formulas', () => {
  test('computeCbTotal1 sums all components', () => {
    expect(computeCbTotal1(100, 200, 50, 10, 5, 15)).toBe(380);
  });
  test('computeCbTotal2 sums disbursement side values', () => {
    expect(computeCbTotal2(30, 20, 15, 5)).toBe(70);
  });
  test('computeOnlineCIH is cbTotal1 - cbTotal2', () => {
    const cb1 = computeCbTotal1(100, 200, 50, 10, 0, 0); // 360
    const cb2 = computeCbTotal2(30, 20, 15, 5); // 70
    expect(computeOnlineCIH(cb1, cb2)).toBe(290);
  });
  test('computeTSO is bs1 - bs2', () => {
    expect(computeTSO(250, 40)).toBe(210);
  });
  test('computeCurrentLoanBalance applies multiplier then adds/disburses and subtracts collection', () => {
    expect(computeCurrentLoanBalance(1000, 500, 200, 1.2)).toBeCloseTo(1000 * 1.2 + 500 - 200, 5);
  });
  test('computeCurrentSavings formula', () => {
    expect(computeCurrentSavings(200, 300, 50)).toBe(450);
  });
  test('computeDisbursementRoll sums previous + daily', () => {
    expect(computeDisbursementRoll(100, 35)).toBe(135);
  });
  test('treats undefined/null inputs as zero', () => {
    expect(computeCbTotal1(undefined, null, 0, 0, 0, 0)).toBe(0);
    expect(computeCbTotal2(undefined, 5, null, 0)).toBe(5);
    expect(computeCurrentLoanBalance(undefined, undefined, undefined)).toBe(0);
  });
});

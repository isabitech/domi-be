import formulas, { computeOnlineCIH, computeTSO, computeCbTotal1, computeCbTotal2, computeCurrentLoanBalance, computeCurrentSavings, computeDisbursementRoll } from '../utils/formulas.js';

describe('Formulas utility', () => {
  test('computeCbTotal1 sums all inputs', () => {
    expect(computeCbTotal1(10, 5, 3, 2, 4, 1)).toBe(25);
  });
  test('computeCbTotal2 sums expected fields', () => {
    expect(computeCbTotal2(7, 2, 3, 1)).toBe(13);
  });
  test('computeOnlineCIH difference', () => {
    expect(computeOnlineCIH(200, 50)).toBe(150);
  });
  test('computeTSO difference', () => {
    expect(computeTSO(500, 120)).toBe(380);
  });
  test('computeCurrentLoanBalance applies multiplier and arithmetic', () => {
    expect(computeCurrentLoanBalance(100, 20, 30, 1.1)).toBeCloseTo(100 * 1.1 + 20 - 30, 5);
  });
  test('computeCurrentSavings calculates net savings', () => {
    expect(computeCurrentSavings(40, 100, 15)).toBe(125);
  });
  test('computeDisbursementRoll aggregates', () => {
    expect(computeDisbursementRoll(300, 45)).toBe(345);
  });
  test('default export contains all functions', () => {
    ['computeCbTotal1','computeCbTotal2','computeOnlineCIH','computeTSO','computeCurrentLoanBalance','computeCurrentSavings','computeDisbursementRoll'].forEach(fn => {
      expect(typeof formulas[fn]).toBe('function');
    });
  });
});

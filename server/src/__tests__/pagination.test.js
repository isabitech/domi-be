import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

describe('pagination utils', () => {
  test('parsePagination defaults', () => {
    const { page, limit, skip } = parsePagination({});
    expect(page).toBe(1);
    expect(limit).toBe(10);
    expect(skip).toBe(0);
  });
  test('parsePagination clamps values', () => {
    const { page, limit } = parsePagination({ page: '-5', limit: '5000' });
    expect(page).toBe(1);
    expect(limit).toBe(100);
  });
  test('buildPaginationMeta', () => {
    const meta = buildPaginationMeta(95, 2, 10);
    expect(meta.pages).toBe(10);
    expect(meta.total).toBe(95);
  });
});

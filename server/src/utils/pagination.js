export function parsePagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(total, page, limit) {
  const pages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    pages,
    total,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}

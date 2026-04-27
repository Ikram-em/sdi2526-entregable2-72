function paginate(totalItems, currentPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const skip = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    skip,
    totalItems,
    totalPages,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages
  };
}

module.exports = {
  paginate
};

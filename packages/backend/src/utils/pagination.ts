const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getPaginationParams(
  limitParam: unknown,
  offsetParam: unknown,
): { take: number; skip: number } {
  let limit = Number(limitParam);
  let offset = Number(offsetParam);

  if (!Number.isFinite(limit) || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }
  if (!Number.isFinite(offset) || offset < 0) {
    offset = 0;
  }

  limit = Math.min(Math.floor(limit), MAX_LIMIT);
  return { take: limit, skip: Math.floor(offset) };
}

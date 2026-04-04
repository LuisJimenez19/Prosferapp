export function generateLocalId(prefix = 'local') {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${prefix}_${timestamp}_${randomPart}`;
}

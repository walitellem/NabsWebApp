export const generateKey = (
  id: string | number | undefined | null,
  index: number | string,
  namespace: string = 'key'
): string => {
  const safeId = (id !== undefined && id !== null && String(id).trim() !== '') ? String(id).trim() : 'fallback';
  return `${namespace}-${safeId}-${index}`;
};

export const formatKRW = (n: number): string => {
  if (!Number.isFinite(n)) return '0원';
  return `${new Intl.NumberFormat('ko-KR').format(Math.round(n))}원`;
};

export const formatNum = (n: number): string =>
  new Intl.NumberFormat('ko-KR').format(Math.round(n));

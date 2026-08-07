export const inr = (n: number): string =>
  '₹' + Number(n || 0).toFixed(0);

export const inr2 = (n: number): string =>
  '₹' + Number(n || 0).toFixed(2);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const lineGst = (price: number, qty: number, pct: number): number =>
  (price * qty * pct) / 100;

export const lineTotal = (price: number, qty: number, pct: number): number =>
  price * qty + lineGst(price, qty, pct);

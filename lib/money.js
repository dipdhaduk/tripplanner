const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  const amount = Number(value || 0);
  return inr.format(Number.isFinite(amount) ? amount : 0);
}

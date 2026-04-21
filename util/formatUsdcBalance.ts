export const formatUsdcBalance = (balance: unknown) => {
  if (!balance) return "0.00";
  try {
    const raw = BigInt(String(balance));
    return (Number(raw) / 1e6).toFixed(2);
  } catch {
    return "0.00";
  }
};

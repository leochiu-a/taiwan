/** Rain intensity 0–1 for a month: plum rains in May–June, typhoons July–September. */
export function rainAt(month: number) {
  const bump = (peak: number, width: number) => Math.exp(-(((month - peak) / width) ** 2));
  return Math.min(1, bump(5.7, 0.55) + 0.8 * bump(8.3, 0.75));
}

export function rainCaption(month: number) {
  if (rainAt(month) < 0.5) return null;
  return month < 7 ? "梅雨季，鋒面帶來連日的雨" : "颱風季，午後雷陣雨和颱風輪流報到";
}

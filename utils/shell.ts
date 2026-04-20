// Wraps a string in single quotes, escaping any embedded single quotes.
// Safe for use as a shell argument regardless of spaces or special characters.
export const shellQuote = (s: string): string => `'${s.replace(/'/g, "'\\''")}'`;

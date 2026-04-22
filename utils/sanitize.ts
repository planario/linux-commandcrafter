/**
 * Input sanitization and validation utilities.
 *
 * All helpers here operate purely on strings — no side effects.
 * Builders should use these to validate user input before building commands.
 */

/** Maximum characters accepted in the Command Analyzer input field. */
export const MAX_ANALYZER_INPUT_LENGTH = 2000;

/** Maximum characters accepted for a cron command string. */
export const MAX_CRON_COMMAND_LENGTH = 1000;

/**
 * Validates a single cron time field (minute, hour, DOM, month, DOW).
 * Allows: digits, *, /, -, , and the special strings @reboot/@hourly etc.
 */
export function isValidCronField(value: string): boolean {
  if (!value) return false;
  // Special @-strings are only valid in the "minute" position when used alone,
  // but we validate per-field so we accept them broadly here.
  if (/^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)$/.test(value)) {
    return true;
  }
  return /^[\d*,\-/]+$/.test(value);
}

/** Patterns that suggest a generated command could cause serious system damage. */
const DANGEROUS_PATTERNS: RegExp[] = [
  /rm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+\/(?!\w)/,   // rm -rf /  or rm -fr /
  /rm\s+-[a-zA-Z]*f[a-zA-Z]*r?\s+\/(?!\w)/,   // rm -fr /
  /:\s*\(\s*\)\s*\{.*\|.*:.*\}/,               // fork bomb  :(){:|:&};:
  /mkfs\b/,                                     // filesystem formatter
  /dd\s+.*of=\/dev\/(sd|hd|nvme|vd)/,          // dd writing to raw disk
  /chmod\s+-R\s+777\s+\//,                      // chmod 777 on /
  />\s*\/dev\/(sd|hd|nvme|vd)/,                // redirect to raw disk
  /(curl|wget)\s+.*\|\s*(ba|da|z|fi)?sh/,      // curl|sh pipe execution
  /mv\s+\/dev\/null\s+/,                        // overwriting with /dev/null
];

/** Returns true when the command string matches a known destructive pattern. */
export function isDangerousCommand(cmd: string): boolean {
  return DANGEROUS_PATTERNS.some(re => re.test(cmd));
}

/** Truncates a string to maxLength, returning the truncated value. */
export function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

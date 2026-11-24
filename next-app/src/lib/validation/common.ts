import { z } from "zod";

/** Trimmed, whitespace-collapsed display name. */
export const nameField = (label = "Name", min = 2, max = 120) =>
  z.string({ error: `${label} is required.` }).transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min, `${label} must be at least ${min} characters.`).max(max, `${label} must be at most ${max} characters.`));

/** Optional email: empty, or a valid lower-cased address. */
export const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.union([z.literal(""), z.string().email("Enter a valid email address.").max(254, "Email is too long.")]).optional(),
);

/** Optional phone. Indian numbers (+91 or bare) must be 10-digit mobiles starting 6-9; other countries 7-15 digits. */
export const optionalPhone = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().max(30, "Phone number is too long.").optional().refine((value) => {
    if (!value) return true;
    if (!/^[+\d][\d\s\-()]*$/.test(value)) return false;
    const digits = value.replace(/\D/g, "");
    if (value.startsWith("+") && !value.startsWith("+91")) return digits.length >= 8 && digits.length <= 15;
    const national = value.startsWith("+91") ? digits.slice(2) : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    return /^[6-9]\d{9}$/.test(national);
  }, "Enter a valid 10-digit Indian mobile number (+91) or a full international number."),
);

const twoDecimals = (value: number) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

/** Number with at most two decimals within [min,max] (rejects NaN/Infinity). */
export const money = (label: string, opts: { min?: number; max?: number; positive?: boolean; nonZero?: boolean } = {}) => {
  const { min = -1_000_000_000, max = 1_000_000_000, positive = false, nonZero = false } = opts;
  return z.coerce.number({ error: `${label} must be a number.` }).finite(`${label} must be a number.`)
    .refine((value) => !positive || value > 0, `${label} must be greater than zero.`)
    .refine((value) => !nonZero || value !== 0, `${label} cannot be zero.`)
    .refine((value) => value >= min, `${label} cannot be below ${min.toLocaleString("en-IN")}.`)
    .refine((value) => value <= max, `${label} cannot exceed ${max.toLocaleString("en-IN")}.`)
    .refine(twoDecimals, `${label} can have at most two decimal places.`);
};

export const percent = (label = "Percentage", opts: { positive?: boolean } = {}) =>
  money(label, { min: 0, max: 100, positive: opts.positive });

/** IST calendar date + 1 day: dates beyond this are "in the future". */
export function endOfTodayIst() {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1) - 5.5 * 3600_000);
}

export const pastOrToday = (label = "Date") =>
  z.coerce.date({ error: `${label} is not a valid date.` })
    .refine((value) => value < endOfTodayIst(), `${label} cannot be in the future.`)
    .refine((value) => value.getUTCFullYear() >= 2000, `${label} is too far in the past.`);

export const SUM_TOLERANCE = 0.005;

import { pinyin } from "pinyin-pro";

export function toPinyin(chinese: string): string {
  return pinyin(chinese, { toneType: "none", type: "array" }).join("");
}

/** Strip spaces, dashes, dots, parentheses — keep only digits and leading '+'. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

const PHONE_DIGITS_RE = /^\+?\d{8,15}$/;

/** Returns null if valid, or an error key string if invalid. */
export function validatePhone(phone: string): string | null {
  if (!phone) return "required";
  if (!PHONE_DIGITS_RE.test(phone)) return "invalid";
  return null;
}

export function getPhoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function buildSearchText(nameCn: string, namePinyin: string, phone: string): string {
  const phoneLast4 = getPhoneLast4(phone);
  return `${nameCn} ${namePinyin} ${phone} ${phoneLast4}`.toLowerCase();
}

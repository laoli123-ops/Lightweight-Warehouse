import { pinyin } from "pinyin-pro";

export function toPinyin(chinese: string): string {
  return pinyin(chinese, { toneType: "none", type: "array" }).join("");
}

export function getPhoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function buildSearchText(nameCn: string, namePinyin: string, phone: string): string {
  const phoneLast4 = getPhoneLast4(phone);
  return `${nameCn} ${namePinyin} ${phone} ${phoneLast4}`.toLowerCase();
}

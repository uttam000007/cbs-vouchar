// Utility functions for Bengali digits, number formatting, and Taka in words conversion

const BEN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENG_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert English number or string with digits to Bengali digits
 */
export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const str = num.toString();
  return str.replace(/\d/g, (match) => BEN_DIGITS[parseInt(match, 10)] || match);
}

/**
 * Convert Bengali digits string to English number string
 */
export function toEnglishNumber(str: string): string {
  if (!str) return '0';
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(BEN_DIGITS[i], ENG_DIGITS[i]);
  }
  return result;
}

/**
 * Format currency amount with Bengali taka symbol and Bengali digits
 */
export function formatTaka(amount: number): string {
  if (isNaN(amount)) return '৳ ০.০০';
  const formatted = amount.toLocaleString('bn-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `৳ ${formatted}`;
}

const units = [
  '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
  'এগারো', 'বারো', 'তেরো', 'চোদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ'
];

const tensMap: Record<number, string> = {
  20: 'বিশ', 21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ',
  30: 'ত্রিশ', 31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ',
  40: 'চল্লিশ', 41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চৌয়াল্লিশ', 45: 'পঁচতাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ',
  50: 'পঞ্চাশ', 51: 'একান্ন', 52: 'বাএইচান্ন', 53: 'তিপ্পান্ন', 54: 'চৌয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট',
  60: 'ষাট', 61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর',
  70: 'সত্তর', 71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চৌহাত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনাশীতি',
  80: 'অশীতির', 81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চৌরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টাসি', 89: 'উননব্বই',
  90: 'নব্বই', 91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চৌরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
};

function getTwoDigitWords(n: number): string {
  if (n <= 0) return '';
  if (n <= 19) return units[n];
  if (tensMap[n]) return tensMap[n];
  return n.toString();
}

/**
 * Convert number to Bengali words for Taka amount
 */
export function takaToBengaliWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'শূন্য টাকা মাত্র';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let num = integerPart;
  const parts: string[] = [];

  // Crores (কোটি)
  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    parts.push(`${takaToBengaliWords(crore).replace(' টাকা মাত্র', '')} কোটি`);
    num %= 10000000;
  }

  // Lakhs (লক্ষ)
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    parts.push(`${getTwoDigitWords(lakh)} লক্ষ`);
    num %= 100000;
  }

  // Thousands (হাজার)
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    parts.push(`${getTwoDigitWords(thousand)} হাজার`);
    num %= 1000;
  }

  // Hundreds (শত)
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    parts.push(`${units[hundred]} শত`);
    num %= 100;
  }

  // Tens and units
  if (num > 0) {
    parts.push(getTwoDigitWords(num));
  }

  let result = parts.join(' ') + ' টাকা';

  if (decimalPart > 0) {
    result += ` এবং ${getTwoDigitWords(decimalPart)} পয়সা`;
  }

  return `${result} মাত্র`;
}

/**
 * Format date to Bengali string (e.g. 07/08/2026 -> ০৭/০৮/২০২৬)
 */
export function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return toBengaliNumber(dateStr);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    
    return `${toBengaliNumber(day)}/${toBengaliNumber(month)}/${toBengaliNumber(year)}`;
  } catch {
    return toBengaliNumber(dateStr);
  }
}

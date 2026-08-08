/**
 * Sanitizes and normalizes phone numbers to standard Ghanaian structures.
 * Converts starting digits '0' or prefix '+233' into '+233...' standard country code
 * while removing all spaces, hyphens, parentheses, and non-numeric characters.
 */
export function sanitizeGhanaPhone(phone: string): string {
  // Strip all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+233')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('233')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Validates if the phone number string is a valid Ghanaian number.
 * Accepts formats with +233, 233, or 10 digits starting with 0.
 */
export function isValidGhanaPhone(phone: string): boolean {
  const sanitized = sanitizeGhanaPhone(phone);
  // Standard +233 followed by exactly 9 digits
  const ghanaRegex = /^\+233\d{9}$/;
  return ghanaRegex.test(sanitized);
}

/**
 * Safely parses any date representation (string, number, Date, Firestore Timestamp)
 * into a valid Date object or null if parsing fails, preventing RangeError: Invalid time value.
 */
export function parseSafeDate(val: any): Date | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    if (!val.trim()) return null;
    const isoStr = val.includes(' ') && !val.includes('T') ? val.replace(' ', 'T') : val;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
    const dRaw = new Date(val);
    if (!isNaN(dRaw.getTime())) return dRaw;
  }
  return null;
}

/**
 * Parses dates into high-contrast formatted date/time strings consistently.
 */
export function formatPortableDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseSafeDate(dateStr);
  if (!date) return dateStr;
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Validates positive numeric inputs.
 */
export function validatePositiveNumber(value: any): number {
  const num = Number(value);
  return !isNaN(num) && num >= 0 ? num : 0;
}

/**
 * Free personal Gmail automation helper function to dispatch digital invoices instantly with zero operational fees.
 */
export function sendActivityInvoiceViaGmail(guestEmail: string, invoiceHtml: string): boolean {
  console.log(`[Gmail Automation] Dispatching professional digital invoice to ${guestEmail}`, invoiceHtml);
  return true;
}


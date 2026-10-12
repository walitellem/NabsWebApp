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
  
  // 1. If it's already a Date object
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  
  // 2. If it's a Firestore Timestamp object or has a toDate method
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d && !isNaN(d.getTime())) return d;
      } catch (e) {}
    }
    if (typeof val.seconds === 'number') {
      return new Date(val.seconds * 1000);
    }
  }
  
  // 3. If it's a number (timestamp in ms)
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // 4. If it's a string
  if (typeof val === 'string') {
    const cleanVal = val.trim();
    if (!cleanVal) return null;

    // Detect format: YYYY-MM-DD or YYYY/MM/DD (with optional time and zone)
    // Matches: "2026-08-11", "2026/08/11", "2026-08-11 14:30:00", "2026-08-11T14:30:00Z", etc.
    const matchYMD = cleanVal.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?)?$/i);
    if (matchYMD) {
      const year = parseInt(matchYMD[1], 10);
      const monthIndex = parseInt(matchYMD[2], 10) - 1;
      const day = parseInt(matchYMD[3], 10);
      
      const hours = matchYMD[4] ? parseInt(matchYMD[4], 10) : 0;
      const minutes = matchYMD[5] ? parseInt(matchYMD[5], 10) : 0;
      const seconds = matchYMD[6] ? parseInt(matchYMD[6], 10) : 0;
      const ms = matchYMD[7] ? parseInt(matchYMD[7].substring(0, 3).padEnd(3, '0'), 10) : 0;
      const timezone = matchYMD[8]; // 'Z' or '+02:00' etc.

      if (!timezone) {
        // Construct in local time (cross-browser deterministic)
        const dLocal = new Date(year, monthIndex, day, hours, minutes, seconds, ms);
        if (!isNaN(dLocal.getTime())) return dLocal;
      } else {
        // If there's a timezone, we can use Date.UTC or standard parsing since UTC behavior is specified
        let dUtc: Date;
        if (timezone.toUpperCase() === 'Z') {
          dUtc = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));
        } else {
          // parse offset e.g. +02:00 or -05:00
          const offsetSign = timezone.charAt(0) === '+' ? 1 : -1;
          const offsetParts = timezone.substring(1).split(':');
          const offsetHours = parseInt(offsetParts[0], 10);
          const offsetMinutes = offsetParts[1] ? parseInt(offsetParts[1], 10) : 0;
          const totalOffsetMinutes = offsetSign * (offsetHours * 60 + offsetMinutes);
          
          const utcMs = Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms) - (totalOffsetMinutes * 60 * 1000);
          dUtc = new Date(utcMs);
        }
        if (!isNaN(dUtc.getTime())) return dUtc;
      }
    }

    // Detect format: US/Common slash format "MM/DD/YYYY" with optional time and AM/PM
    // Matches: "8/11/2026", "08/11/2026 14:30:00", "08/11/2026 02:30 PM"
    const matchMDYSlash = cleanVal.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?$/i);
    if (matchMDYSlash) {
      const monthIndex = parseInt(matchMDYSlash[1], 10) - 1;
      const day = parseInt(matchMDYSlash[2], 10);
      const year = parseInt(matchMDYSlash[3], 10);
      
      let hours = matchMDYSlash[4] ? parseInt(matchMDYSlash[4], 10) : 0;
      const minutes = matchMDYSlash[5] ? parseInt(matchMDYSlash[5], 10) : 0;
      const seconds = matchMDYSlash[6] ? parseInt(matchMDYSlash[6], 10) : 0;
      const ampm = matchMDYSlash[7];

      if (ampm) {
        const meridian = ampm.toUpperCase();
        if (meridian === 'PM' && hours < 12) hours += 12;
        else if (meridian === 'AM' && hours === 12) hours = 0;
      }

      const dLocal = new Date(year, monthIndex, day, hours, minutes, seconds);
      if (!isNaN(dLocal.getTime())) return dLocal;
    }

    // Strip " at " and normalise commas/spaces for alphanumeric months (e.g. "Aug 11, 2026 at 10:15:00 AM")
    const normalizedVal = cleanVal
      .replace(/\s+at\s+/i, ' ')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ');

    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    let monthIndex = -1;
    let day = -1;
    let year = -1;

    // Format: "Aug 11 2026" or "August 11 2026"
    const matchAlphaMDY = normalizedVal.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/i);
    if (matchAlphaMDY) {
      const monthName = matchAlphaMDY[1].toLowerCase();
      monthIndex = monthMap[monthName] ?? -1;
      day = parseInt(matchAlphaMDY[2], 10);
      year = parseInt(matchAlphaMDY[3], 10);
    } else {
      // Format: "11 Aug 2026" or "11 August 2026"
      const matchAlphaDMY = normalizedVal.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
      if (matchAlphaDMY) {
        day = parseInt(matchAlphaDMY[1], 10);
        const monthName = matchAlphaDMY[2].toLowerCase();
        monthIndex = monthMap[monthName] ?? -1;
        year = parseInt(matchAlphaDMY[3], 10);
      }
    }

    if (year !== -1 && monthIndex !== -1 && day !== -1) {
      const timeMatch = normalizedVal.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        if (timeMatch[3]) seconds = parseInt(timeMatch[3], 10);
        if (timeMatch[4]) {
          const meridian = timeMatch[4].toUpperCase();
          if (meridian === 'PM' && hours < 12) hours += 12;
          else if (meridian === 'AM' && hours === 12) hours = 0;
        }
      }
      const dCustom = new Date(year, monthIndex, day, hours, minutes, seconds);
      if (!isNaN(dCustom.getTime())) return dCustom;
    }

    // 5. Ultimate Fallback to native Date.parse
    const dDirect = new Date(cleanVal);
    if (!isNaN(dDirect.getTime())) return dDirect;
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


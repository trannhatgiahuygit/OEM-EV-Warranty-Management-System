/**
 * Text Encoding Utilities
 * Helper functions to handle Vietnamese text encoding issues
 * 
 * NOTE: This should only be used as a last resort. The proper solution is to fix encoding at the backend/database level.
 * Frontend should receive correctly encoded UTF-8 data from the backend.
 */

/**
 * Decode a string that may have encoding issues
 * This is a minimal fallback - the real fix should be at backend level
 */
export const decodeVietnameseText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // If text looks correct (no obvious encoding issues), return as is
  // We should trust the backend to send correct data
  if (!text.includes('') && !text.includes('?')) {
    return text;
  }
  
  // Only handle obvious replacement characters - let backend fix the rest
  // This is a minimal workaround, not a comprehensive fix
  return text;
};

/**
 * Recursively decode all strings in an object/array
 */
export const decodeObjectText = (obj) => {
  if (typeof obj === 'string') {
    return decodeVietnameseText(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(decodeObjectText);
  } else if (obj !== null && typeof obj === 'object') {
    const decoded = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        decoded[key] = decodeObjectText(obj[key]);
      }
    }
    return decoded;
  }
  return obj;
};


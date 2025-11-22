/**
 * Axios Configuration
 * Ensures all requests use UTF-8 encoding for proper Vietnamese character support
 */
import axios from 'axios';

// Set default headers for all axios requests
axios.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8';
axios.defaults.headers.common['Accept'] = 'application/json; charset=utf-8';

// Request interceptor to ensure UTF-8 encoding
axios.interceptors.request.use(
  (config) => {
    // Ensure Content-Type includes charset for all requests
    if (config.headers && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json; charset=utf-8';
    } else if (config.headers && config.headers['Content-Type'] && !config.headers['Content-Type'].includes('charset')) {
      config.headers['Content-Type'] = config.headers['Content-Type'] + '; charset=utf-8';
    }
    
    // Ensure Accept header includes charset
    if (config.headers && !config.headers['Accept']) {
      config.headers['Accept'] = 'application/json; charset=utf-8';
    } else if (config.headers && config.headers['Accept'] && !config.headers['Accept'].includes('charset')) {
      config.headers['Accept'] = config.headers['Accept'] + '; charset=utf-8';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to ensure proper UTF-8 decoding
axios.interceptors.response.use(
  (response) => {
    // Check response headers for charset
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    const charsetMatch = contentType.match(/charset=([^;]+)/i);
    const charset = charsetMatch ? charsetMatch[1].trim().toLowerCase() : null;
    
    // Log encoding info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Response encoding:', {
        contentType,
        charset: charset || 'not specified (defaulting to UTF-8)',
        hasData: !!response.data,
        url: response.config?.url
      });
    }
    
    // If response is a string (not yet parsed JSON), ensure it's treated as UTF-8
    if (response.data && typeof response.data === 'string') {
      try {
        // Axios should automatically parse JSON, but if it's still a string, parse it
        response.data = JSON.parse(response.data);
      } catch (e) {
        // If not JSON, keep as string
      }
    }
    
    // Try to detect and fix encoding issues in response data
    // This is a workaround - the real fix should be at backend level
    if (response.data) {
      const fixEncoding = (obj) => {
        if (typeof obj === 'string') {
          // Check if string has encoding issues (contains ? or replacement characters)
          if (obj.includes('?') || obj.includes('')) {
            // Log the problematic string for debugging
            if (process.env.NODE_ENV === 'development') {
              console.warn('Potential encoding issue detected:', obj);
            }
            // Return as is - we can't fix without knowing source encoding
            // Backend should fix this
            return obj;
          }
          return obj;
        } else if (Array.isArray(obj)) {
          return obj.map(fixEncoding);
        } else if (obj !== null && typeof obj === 'object') {
          const fixed = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              fixed[key] = fixEncoding(obj[key]);
            }
          }
          return fixed;
        }
        return obj;
      };
      
      response.data = fixEncoding(response.data);
    }
    
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;


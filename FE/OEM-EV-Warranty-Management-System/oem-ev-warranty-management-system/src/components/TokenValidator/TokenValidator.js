import React from 'react';
import useTokenValidation from '../../hooks/useTokenValidation';

/**
 * TokenValidator Component
 * 
 * This component runs in the background and validates the user's token
 * every 10 seconds. It handles:
 * - Valid tokens: No action
 * - Invalid/expired tokens (401): Shows message, clears localStorage, redirects to login
 * - Connection errors: Shows countdown message until connection is restored
 * - Stops validation when user is not logged in
 */
const TokenValidator = () => {
  useTokenValidation();
  
  // This component doesn't render anything, it just runs the validation logic
  return null;
};

export default TokenValidator;


import React from 'react';

const RequiredIndicator = ({ className = '' }) => (
  <span
    className={['required-indicator', className].filter(Boolean).join(' ')}
    aria-hidden="true"
  >
    *
  </span>
);

export default RequiredIndicator;


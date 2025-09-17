'use client';

import React from 'react';

const Label = React.forwardRef(
  ({ className = '', children, ...props }, ref) => {
    const classes = `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`;
    
    return (
      <label
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };
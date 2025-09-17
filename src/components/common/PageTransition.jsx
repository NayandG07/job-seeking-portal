'use client';

import React from 'react';

/**
 * PageTransition Component
 * 
 * Provides smooth transitions between page content with accessibility support
 */
export default function PageTransition({ 
  children, 
  className = '',
  delay = 0 
}) {
  return (
    <div 
      className={`animate-fade-in ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered Animation Wrapper
 * 
 * Animates children with staggered delays for smooth cascading effects
 */
export function StaggeredChildren({ 
  children, 
  className = '',
  delayIncrement = 100,
  startDelay = 0
}) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <PageTransition 
          key={index}
          delay={startDelay + (index * delayIncrement)}
        >
          {child}
        </PageTransition>
      ))}
    </div>
  );
}
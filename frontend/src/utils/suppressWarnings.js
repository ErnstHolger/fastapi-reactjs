// Suppress known development-only warnings that don't affect functionality
if (process.env.NODE_ENV === 'development') {
  // Store original console.warn
  const originalWarn = console.warn;
  
  // Override console.warn to filter out specific warnings
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress ECharts passive event listener warnings
    if (message.includes('Added non-passive event listener to a scroll-blocking')) {
      return;
    }
    
    // Suppress React DevTools suggestion (it's just informational)
    if (message.includes('Download the React DevTools for a better development experience')) {
      return;
    }
    
    // Call original console.warn for other warnings
    originalWarn.apply(console, args);
  };
}
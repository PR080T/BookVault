import { useEffect, useRef } from 'react';  // React library import

export function useInterval(callback, delay) {  // Export for use in other modules
  const callbackRef = useRef();

  useEffect(() => {  // React effect hook for side effects
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {  // React effect hook for side effects
    function tick() {
        callbackRef.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);  // JSX return statement
    }
  }, [callback, delay]);
};
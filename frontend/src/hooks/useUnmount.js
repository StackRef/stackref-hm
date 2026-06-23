import { useEffect, useRef } from 'react';

export function useUnmount(fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(
    () => () => {
      if (fnRef.current) {
        fnRef.current();
      }
    },
    [],
  );
}

export default useUnmount;

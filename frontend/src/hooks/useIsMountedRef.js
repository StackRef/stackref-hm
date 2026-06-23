import { useEffect, useRef } from 'react';

const useIsMountedRef = () => {
  const isMounted = useRef(true);

  // For some reason with React 18 from July 2022, this always returns false
  /*
  useEffect(() => () => {
    isMounted.current = false;
  }, []);
  */

  return isMounted;
};

export default useIsMountedRef;

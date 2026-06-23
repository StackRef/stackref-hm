import { useRef, useEffect } from 'react';

export function usePrevious(props) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = props;
  }, [props]);
  return ref.current;
}

export default usePrevious;

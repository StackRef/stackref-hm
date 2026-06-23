import { useContext } from 'react';

import StackRefContext from 'src/contexts/StackRefContext';

const useStackRef = () => useContext(StackRefContext);

export default useStackRef;

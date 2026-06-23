import React from 'react';

// why-did-you-render is a development-only debugging aid. The dynamic import is
// dead-code-eliminated from production builds because import.meta.env.DEV is
// statically false there.
if (import.meta.env.DEV) {
  const { default: whyDidYouRender } = await import(
    '@welldone-software/why-did-you-render'
  );
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
  });
}

import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'recipe-ui',
  outputTargets: [
    // Primary consumption path. Plain ESM with a single `defineCustomElements()`
    // entrypoint, which is what the SvelteKit app calls on mount. Chosen over the
    // lazy `dist` loader because it bundles predictably under Vite.
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'bundle',
      generateTypeDeclarations: true,
      isPrimaryPackageOutputTarget: true,
    },
    // Kept as a fallback consumption path (exposed as the "./loader" subpath).
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
  ],
  validatePrimaryPackageOutputTarget: true,
};

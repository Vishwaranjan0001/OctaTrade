// Bundles React Bits components (real source, see reactbits/) into static islands.
// Usage: npm install && npm run build  ->  ../js/islands-*.js + ../css/islands-*.css
import { build } from 'esbuild';
import { copyFileSync, existsSync } from 'node:fs';

const common = {
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: {
    gsap: './shims/gsap.js',
    'gsap/ScrollTrigger': './shims/ScrollTrigger.js',
    'gsap/SplitText': './shims/SplitText.js',
  },
  logLevel: 'info',
  legalComments: 'none',
  banner: {
    js: '/* Includes components from React Bits (reactbits.dev), (c) David Haz, MIT + Commons Clause. See islands/reactbits/LICENSE.md */',
    css: '/* Includes styles from React Bits (reactbits.dev), (c) David Haz, MIT + Commons Clause. */',
  },
};

for (const name of ['landing', 'home']) {
  if (!existsSync(`${name}.jsx`)) continue;
  await build({ ...common, entryPoints: { [`islands-${name}`]: `${name}.jsx` }, outdir: 'out' });
  copyFileSync(`out/islands-${name}.js`, `../js/islands-${name}.js`);
  copyFileSync(`out/islands-${name}.css`, `../css/islands-${name}.css`);
}

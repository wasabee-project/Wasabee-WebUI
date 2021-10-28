import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import css from 'rollup-plugin-css-only';

import { createFilter } from '@rollup/pluginutils';

import fs from 'fs';

const production = !process.env.ROLLUP_WATCH && !process.env.DEVELOPMENT;
const watch = process.env.ROLLUP_WATCH;
const development = process.env.DEVELOPMENT;

function userscript() {
  return {
    writeBundle(_, bundle) {
      let out = fs.createWriteStream('wasabee-webui.user.js');
      out.on('open', () => {
        require('child_process').spawn(
          'cat',
          ['wrapper_head.js', 'public/build/bundle.js', 'wrapper_foot.js'],
          {
            stdio: ['ignore', out, 'inherit'],
            shell: true,
          }
        );
      });
    },
  };
}

function userscriptCss(options = {}) {
  const filter = createFilter(options.include || ['**/*.css'], options.exclude);

  return {
    name: 'userscript-css',
    transform(code, id) {
      if (!filter(id)) {
        return;
      }
      return {
        code: 'addCSS(' + JSON.stringify(code) + ');',
        map: { mappings: '' },
      };
    },
  };
}

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    development && userscriptCss(),
    !development && css(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    json(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),

    development && userscript(),

    watch && serve('public'),
  ],
  watch: {
    clearScreen: false,
  },
};

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts'],
  format: ['cjs', 'esm'], // Support both CommonJS and ES Modules
  dts: true,              // Generate declaration files (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true
});

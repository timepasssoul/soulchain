import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig(async () => {
  const tailwindcss = (await import('tailwindcss')).default;
  const autoprefixer = (await import('autoprefixer')).default;

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            '@emotion/babel-plugin',
            ['babel-plugin-direct-import', { modules: ['lucide-react'] }]
          ]
        }
      }),
      ViteImageOptimizer({
        jpg: { quality: 80 },
        png: { quality: 80 },
        webp: { quality: 85, lossless: false },
        svgo: {
          plugins: [{ name: 'preset-default' }, 'removeViewBox']
        }
      }),
      visualizer({
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ],
    resolve: {
      alias: {
        buffer: 'buffer',
        process: 'process/browser',
        '@': path.resolve(__dirname, './src')
      },
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      force: true,
      esbuildOptions: {
        define: {
          global: 'globalThis'
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true
          })
        ]
      }
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      cssCodeSplit: true,
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        plugins: [rollupNodePolyFill()],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor_react';
              if (id.includes('lucide')) return 'vendor_icons';
              if (id.includes('@web3modal') || id.includes('@walletconnect') || id.includes('@reown')) return 'vendor_web3';
              return 'vendor';
            }
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js'
        }
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log']
        },
        format: {
          comments: false
        }
      }
    },
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer]
      },
      modules: {
        localsConvention: 'camelCaseOnly'
      }
    },
    ssr: {
      noExternal: true
    },
    define: {
      'process.env': {}
    },
    server: {
      host: true,
      port: 4173,
      strictPort: true,
      hmr: {
        clientPort: 4173
      }
    }
  };
});


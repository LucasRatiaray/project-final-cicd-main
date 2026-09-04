
// vite.config.js

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const productTarget = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000'
const authTarget = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
const orderTarget = process.env.ORDER_SERVICE_URL || 'http://localhost:3002'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api/products': {
        target: productTarget,
        changeOrigin: true,
        
      },
      '/api/cart': {
        target: productTarget,
        changeOrigin: true,
        
      },
      '/api/auth': {
        target: authTarget,
        changeOrigin: true,
        timeout: 60000, // 60 secondes
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[VITE PROXY] Proxying request to: ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[VITE PROXY] Response received with status: ${proxyRes.statusCode}`);
          });
          proxy.on('error', (err) => {
            console.error(`[VITE PROXY] Proxy error: ${err.message}`);
          });
        },
      },
      '/api/orders': {
        target: orderTarget,
        changeOrigin: true,
        
      }
    }
  }
})

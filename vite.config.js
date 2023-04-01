import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: '5173',
        proxy: {
            '/api/search': {
                target: 'http://127.0.0.1:5174/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '') // 不可以省略rewrite
            },
            '/api/files': {
                target: 'https://www.cpppc.org:8082/api/pub/project/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/files/, ''), // 不可以省略rewrite
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        proxyReq.setHeader('referer', `http://www.cpppc.org:8082/inforpublic/homepage.html`)
                        proxyReq.setHeader('origin', `http://www.cpppc.org:8082/inforpublic/homepage.html`)
                    })
                }
            }
        }
    }
})

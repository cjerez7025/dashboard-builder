/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Permitir que /embed sea embebido en iframes desde cualquier origen
        source: '/embed',
        headers: [
          { key: 'X-Frame-Options',          value: 'ALLOWALL' },
          { key: 'Content-Security-Policy',   value: "frame-ancestors *;" },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // APIs sin CORS para que el embed pueda cargar datos
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

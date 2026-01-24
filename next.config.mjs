/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base configurations (enable or adjust as needed for your app)
  reactStrictMode: true, // Enables React's Strict Mode for identifying potential problems
  swcMinify: true, // Uses SWC for faster minification
  productionBrowserSourceMaps: false, // Disable source maps in production for security (enable if debugging needed)

  // Asynchronous headers function to set custom HTTP headers for all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            // Content-Security-Policy: Customized to allow necessary sources, avoiding obsolete directives like 'block-all-mixed-content'
            // - default-src: Fallback for unspecified types
            // - script-src: Allows scripts from self, unsafe-eval (for some libs), and Magic.link
            // - connect-src: Permits API fetches (CoinGecko, Magic.link) and XRPL WebSockets
            // - style-src: Allows inline styles (unsafe-inline for Tailwind/Next.js defaults)
            // - font-src: For next/font or external fonts
            // - img-src: For images, including data URIs
            // Adjust based on your app's needs; test thoroughly to avoid blocking resources
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' https://auth.magic.link; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://*; connect-src 'self' https://api.coingecko.com https://auth.magic.link wss://s.altnet.rippletest.net;",
          },
          {
            // Permissions-Policy: Explicitly denies clipboard access if unused, silencing warnings
            // If your app (e.g., Magic.link) needs it, set to 'clipboard-read=(self "https://auth.magic.link")'
            key: 'Permissions-Policy',
            value: 'clipboard-read=(), clipboard-write=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
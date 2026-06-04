/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://img.clerk.com; font-src 'self'; connect-src 'self' https://*.clerk.accounts.dev https://clerk.com *; worker-src 'self' blob:; frame-src 'self' https://*.clerk.accounts.dev;",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
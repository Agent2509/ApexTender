/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // This prevents Next.js from trying to hit your API during the build phase
    output: 'standalone',
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@sparticuz/chromium"],
    outputFileTracingIncludes: {
        "/api/pdf/encontro": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;

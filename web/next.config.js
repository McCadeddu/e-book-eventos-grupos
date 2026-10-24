/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@sparticuz/chromium"],
    outputFileTracingIncludes: {
        "/api/pdf/encontro": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
};

module.exports = nextConfig;

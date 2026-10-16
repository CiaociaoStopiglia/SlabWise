/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // O navegador baixa as fotos das cartas direto da TCGdex,
        // sem passar pelo servidor do Next (que estava dando timeout).
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.tcgdex.net',
            },
        ],
    },
};

export default nextConfig;

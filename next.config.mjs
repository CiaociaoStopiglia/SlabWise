/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Libera as imagens das cartas da TCGdex no <Image> do Next.
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.tcgdex.net',
            },
        ],
    },
};

export default nextConfig;

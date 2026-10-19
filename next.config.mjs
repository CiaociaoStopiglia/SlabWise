/** @type {import('next').NextConfig} */
const nextConfig = {
    // Banco embutido de desenvolvimento (ver src/lib/db.js): usa WebAssembly e arquivos,
    // então o Next não deve empacotar, só carregar do node_modules.
    serverExternalPackages: ['@electric-sql/pglite'],
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

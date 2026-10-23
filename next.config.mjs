/** @type {import('next').NextConfig} */
const nextConfig = {
    // Banco embutido de desenvolvimento (ver src/lib/db.js): usa WebAssembly e arquivos,
    // então o Next não deve empacotar, só carregar do node_modules.
    serverExternalPackages: ['@electric-sql/pglite'],
    // Upload de foto de perfil/banner (até 5 MB) passa por Server Action; o padrão é 1 MB.
    experimental: {
        serverActions: { bodySizeLimit: '6mb' },
    },
    images: {
        // O navegador baixa as fotos das cartas direto da TCGdex,
        // sem passar pelo servidor do Next (que estava dando timeout).
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.tcgdex.net',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
            },
        ],
    },
};

export default nextConfig;

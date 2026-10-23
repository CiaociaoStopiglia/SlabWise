import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import SmoothScroll from '../components/home/SmoothScroll';
import { Suspense } from 'react';
import { Archivo } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AvisoToast from '../components/AvisoToast';

// Mesma fonte das páginas, pros toasts ficarem com a cara do site
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });

export const metadata = {
    title: 'Slabbit',
    description: 'Preço de cartas Pokémon em reais, simulador de graduação PSA e sua coleção.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body className={`min-h-screen antialiased ${archivo.variable}`}>
                <AntdRegistry>{children}</AntdRegistry>
                <SmoothScroll />
                {/* Avisos das ações (?ok= / ?erro= no endereço) viram toast */}
                <Suspense fallback={null}>
                    <AvisoToast />
                </Suspense>
                <Toaster
                    position="top-center"
                    containerStyle={{ top: 84 }}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            padding: '12px 16px',
                            border: '2px solid #15140f',
                            borderRadius: '14px',
                            background: '#fbfaf5',
                            color: '#15140f',
                            boxShadow: '5px 5px 0 #15140f',
                            fontFamily: 'var(--font-archivo), system-ui, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                        },
                        success: { iconTheme: { primary: '#0e7a43', secondary: '#fbfaf5' } },
                        error: { duration: 6000, iconTheme: { primary: '#c8361b', secondary: '#fbfaf5' } },
                    }}
                />
            </body>
        </html>
    );
}

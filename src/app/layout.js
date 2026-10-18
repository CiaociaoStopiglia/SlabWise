import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import SmoothScroll from '../components/home/SmoothScroll';
import { Toaster } from 'react-hot-toast';

export const metadata = {
    title: 'FrontEnd - Codeverse',
    description: 'Template do Codeverse',
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body className="min-h-screen antialiased">
                <AntdRegistry>{children}</AntdRegistry>
                <SmoothScroll />
                <Toaster />
            </body>
        </html>
    );
}

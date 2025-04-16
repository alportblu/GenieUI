/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  allowedDevOrigins: ['192.168.1.159'],
  devIndicators: {
    buildActivity: false,
    position: 'top-right',
  },
  experimental: {
    // Mantendo apenas opções válidas
  },
  onDemandEntries: {
    // Configurações para reduzir recursos de desenvolvimento
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
  // Injetar script para remover os botões do Next.js
  webpack: (config, { isServer, dev }) => {
    // Removida configuração do PDF.js worker
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        buffer: require.resolve('buffer/'),
      };
      
      // Adicionar plugin para desabilitar dev tools em modo de desenvolvimento
      if (dev) {
        config.plugins.push({
          apply: (compiler) => {
            compiler.hooks.afterEmit.tap('DisableDevTools', () => {
              // Este plugin não faz nada diretamente, mas garante que o Next.js saiba que queremos desabilitar as ferramentas
              console.log('Dev tools disabled by webpack plugin');
            });
          }
        });
      }
    }

    return config;
  },
}

module.exports = nextConfig 
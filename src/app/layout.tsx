import './globals.css'
import './mobileStyles.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import HideNextDevTools from '@/components/HideNextDevTools'
import Script from 'next/script'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

// Viewport separado conforme recomendado no Next.js 15+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Local AI Assistant',
  description: 'Your powerful local AI assistant with support for multiple models and file types',
}

if (typeof window !== 'undefined') {
  // Disable error overlay
  window.addEventListener('error', e => {
    if (e && e.message && e.message.includes('Hydration')) {
      e.preventDefault()
      console.error('Hydration error:', e)
    }
  })
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Botão para mostrar/ocultar painel de erros do Next.js
  React.useEffect?.(() => {
    if (process.env.NODE_ENV !== 'development') return;
    // Esconde o painel por padrão
    const hidePanel = () => {
      const panel = document.querySelector('div[data-nextjs-toast]');
      if (panel && panel instanceof HTMLElement) panel.style.display = 'none';
    };
    hidePanel();
    // Cria botão flutuante
    let btn = document.getElementById('show-nextjs-errors-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'show-nextjs-errors-btn';
      btn.innerText = '🐞';
      btn.style.position = 'fixed';
      btn.style.bottom = '24px';
      btn.style.right = '24px';
      btn.style.zIndex = '100000';
      btn.style.background = '#222';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '50%';
      btn.style.width = '44px';
      btn.style.height = '44px';
      btn.style.fontSize = '2rem';
      btn.style.boxShadow = '0 2px 8px #0006';
      btn.style.cursor = 'pointer';
      btn.title = 'Show/hide Next.js error panel';
      btn.onclick = () => {
        const panel = document.querySelector('div[data-nextjs-toast]');
        if (panel && panel instanceof HTMLElement) {
          panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        }
      };
      document.body.appendChild(btn);
    }
    // Esconde o painel ao carregar
    setTimeout(hidePanel, 1000);
    return () => {
      btn?.remove();
    };
  }, []);
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="next-dev-tools" content="hidden" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Script para remover o botão N do Next.js imediatamente */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function removeDevTools() {
                const elements = document.querySelectorAll('[data-next-dev-tool-button], #__next-dev-tools, [data-nextjs-toast]');
                elements.forEach(el => el && el.remove());
                
                // Remover especificamente o botão N
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                  if (btn.textContent?.includes('Issue') || 
                      btn.textContent === 'N' || 
                      btn.innerHTML.includes('Issue')) {
                    btn.style.display = 'none';
                    btn.remove();
                  }
                });
              }
              
              // Executar imediatamente
              removeDevTools();
              
              // Executar novamente após o carregamento do DOM
              document.addEventListener('DOMContentLoaded', removeDevTools);
              
              // Executar periodicamente para garantir
              setInterval(removeDevTools, 300);
              
              // Sobrescrever a função que adiciona o botão
              if (window.__NEXT_DATA__ && window.__NEXT_DATA__.nextExport === false) {
                Object.defineProperty(window, '__NEXT_DEV_TOOLS_BUTTON__', {
                  configurable: true,
                  set: function() {},
                  get: function() { return false; }
                });
              }
            })();
          `
        }} />
        <style>{`
          /* Hide Next.js dev tools */
          #__next-dev-tools, 
          [data-next-dev-tool-button],
          [data-nextjs-toast],
          [data-nextjs-dialog],
          [data-nextjs-dialog-overlay],
          button[aria-label="Next.js development tools"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          
          /* Especificamente o botão N */
          button:has(> div:first-child:only-child > span:first-child:only-child) {
            display: none !important;
          }
        `}</style>
        
        {/* Carregar nosso script externo para remover indicadores */}
        <Script src="/hideNextTools.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning={true} className={inter.className}>
        {children}
        <HideNextDevTools />
      </body>
    </html>
  )
} 
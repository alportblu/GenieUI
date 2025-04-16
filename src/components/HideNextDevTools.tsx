'use client';

import { useEffect } from 'react';

export default function HideNextDevTools() {
  useEffect(() => {
    // Função para esconder os indicadores de desenvolvimento do Next.js
    const hideNextDevTools = () => {
      // Esconder todos os elementos com data-nextjs-*
      const nextJsElements = document.querySelectorAll('[data-nextjs-toast], [data-nextjs-dialog], [data-nextjs-dialog-overlay]');
      nextJsElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Verificar se é um indicador de erro
          const isError = el.getAttribute('data-severity') === 'error';
          
          // Se não for um erro, esconder completamente
          if (!isError) {
            el.style.display = 'none';
          } else {
            // Se for um erro, mover para um canto menos intrusivo
            el.style.top = '10px';
            el.style.left = '10px';
            el.style.bottom = 'auto';
            el.style.right = 'auto';
            el.style.transform = 'scale(0.6)';
            el.style.transformOrigin = 'top left';
            el.style.zIndex = '100000';
            el.style.opacity = '0.7';
          }
        }
      });
      
      // Esconder o botão "N" do Next.js
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        // Verificar se é o botão N específico
        const isDevButton = btn.textContent?.includes('Issue') || 
                           btn.textContent === 'N' || 
                           btn.innerHTML.includes('Issue');
        
        if (isDevButton) {
          // Técnica mais agressiva: remover completamente
          if (btn.parentNode) {
            try {
              btn.parentNode.removeChild(btn);
            } catch (e) {
              // Como alternativa, esconder via CSS
              btn.style.display = 'none';
              btn.style.visibility = 'hidden';
              btn.style.opacity = '0';
              btn.style.pointerEvents = 'none';
              btn.style.position = 'absolute';
              btn.style.top = '-9999px';
              btn.style.left = '-9999px';
            }
          }
        }
      });
      
      // Verificar elementos com classe que pode conter "nextjs"
      document.querySelectorAll('[class*="nextjs"]').forEach(el => {
        if (el instanceof HTMLElement && 
            (el.className.includes('toast') || 
             el.className.includes('dialog') || 
             el.className.includes('overlay'))) {
          el.style.display = 'none';
        }
      });
    };

    // Executar a função imediatamente e a cada 200ms
    hideNextDevTools();
    const interval = setInterval(hideNextDevTools, 200);

    // Adicionar um observador de mutação para detectar quando novos elementos são adicionados
    const observer = new MutationObserver(() => {
      hideNextDevTools();
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Criar uma sobreposição para esconder o botão N (solução de último recurso)
    const createOverlay = () => {
      const overlay = document.createElement('div');
      overlay.className = 'n-button-overlay';
      document.body.appendChild(overlay);
      
      // Em dispositivos móveis, colocar uma sobreposição especial no canto inferior direito
      if (window.innerWidth <= 768) {
        const mobileOverlay = document.createElement('div');
        mobileOverlay.style.position = 'fixed';
        mobileOverlay.style.bottom = '0';
        mobileOverlay.style.right = '0';
        mobileOverlay.style.width = '80px';
        mobileOverlay.style.height = '80px';
        mobileOverlay.style.backgroundColor = 'transparent';
        mobileOverlay.style.zIndex = '999999';
        document.body.appendChild(mobileOverlay);
      }
    };
    
    // Criar a sobreposição após um curto atraso
    setTimeout(createOverlay, 500);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Este componente renderiza uma div transparente que cobre o botão N
  return (
    <>
      <div style={{
        position: 'fixed', 
        bottom: 0, 
        right: 0, 
        width: '80px', 
        height: '80px', 
        zIndex: 99999, 
        background: 'transparent',
        pointerEvents: 'none'
      }} />
    </>
  );
} 
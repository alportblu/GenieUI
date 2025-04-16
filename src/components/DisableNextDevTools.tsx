'use client'

import { useEffect } from 'react'

// Componente para remover completamente o botão N e as ferramentas de desenvolvimento do Next.js
export function DisableNextDevTools() {
  useEffect(() => {
    const hideDevTools = () => {
      // Seletor para todos os elementos relacionados às ferramentas de desenvolvimento
      const selectors = [
        '[data-next-dev-tool-button]',
        '#__next-dev-tools',
        '[id^="__next-"]',
        '[data-testid^="__next-dev-tools-"]',
        '[data-next-dev-tool="true"]',
      ]
      
      // Remover todos os elementos encontrados
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el)
          }
        })
      })
      
      // Também adicionar uma camada de CSS para ocultar qualquer elemento que possa aparecer
      if (!document.getElementById('disable-next-dev-tools-style')) {
        const style = document.createElement('style')
        style.id = 'disable-next-dev-tools-style'
        style.textContent = `
          [data-next-dev-tool-button],
          #__next-dev-tools,
          [id^="__next-"],
          [data-testid^="__next-dev-tools-"],
          [data-next-dev-tool="true"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            margin: -1px !important;
            padding: 0 !important;
            border: 0 !important;
          }
        `
        document.head.appendChild(style)
      }
      
      // Sobrescrever métodos que possam adicionar os botões
      if (window.__NEXT_DATA__) {
        try {
          Object.defineProperty(window, '__NEXT_DEV_TOOLS_BUTTON__', {
            configurable: true,
            set: function() { return false },
            get: function() { return false }
          })
        } catch (e) {
          console.log('Failed to override Next.js dev tools:', e)
        }
      }
    }
    
    // Executar imediatamente
    hideDevTools()
    
    // Configurar um observador para detectar alterações no DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hideDevTools()
        }
      }
    })
    
    // Observar todo o documento
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
    
    // Executar periodicamente para garantir que qualquer adição tardia seja tratada
    const interval = setInterval(hideDevTools, 300)
    
    // Limpar observador e intervalo quando o componente for desmontado
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])
  
  return null
} 
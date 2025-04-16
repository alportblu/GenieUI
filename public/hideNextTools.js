(function() {
  // Esta função será executada imediatamente quando o script for carregado
  
  // Função para remover completamente os elementos do Next.js
  function hideNextDevTools() {
    // Alvos específicos para remover
    const selectors = [
      '[data-nextjs-toast]',
      '[data-nextjs-dialog]', 
      '[data-nextjs-dialog-overlay]',
      '#__next-dev-tools',
      '[data-next-dev-tool-button]',
      'button[aria-label="Next.js development tools"]'
    ];
    
    // Remover todos os elementos que correspondem aos seletores
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.remove();
      });
    });
    
    // Remover especificamente o botão N
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent === 'N' || 
          btn.textContent?.includes('Issue') || 
          btn.innerHTML?.includes('Issue')) {
        btn.remove();
      }
    });
    
    // Remover classes ou elementos adicionados pelo Next.js
    document.querySelectorAll('[class*="nextjs"]').forEach(el => {
      if (el.className.includes('nextjs') && 
          (el.className.includes('toast') || 
           el.className.includes('dialog') || 
           el.className.includes('overlay'))) {
        el.remove();
      }
    });
  }
  
  // Sobrescrever funções globais que o Next.js usa para adicionar elementos
  if (typeof window !== 'undefined') {
    // Desativar o botão de ferramentas de desenvolvimento
    Object.defineProperty(window, '__NEXT_DEV_TOOLS_BUTTON__', {
      configurable: true,
      set: function() {},
      get: function() { return false; }
    });
    
    // Desativar o monitoramento de erros de hidratação
    Object.defineProperty(window, '__NEXT_HMR_LATENCY_CB', {
      configurable: true,
      set: function() {},
      get: function() { return null; }
    });
  }
  
  // Executar a função imediatamente
  hideNextDevTools();
  
  // Executar novamente quando o DOM estiver carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideNextDevTools);
  }
  
  // Executar periodicamente para garantir que novos elementos sejam removidos
  const interval = setInterval(hideNextDevTools, 200);
  
  // Adicionar um observador de mutação para detectar novos elementos
  const observer = new MutationObserver(hideNextDevTools);
  
  // Observar todo o documento para mudanças
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})(); 
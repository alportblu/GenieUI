'use client'

import React, { useEffect } from 'react'
import { Chat } from '@/components/Chat'
import { ModelSelector } from '@/components/ModelSelector'
import { useModelStore } from '@/store/modelStore'
import { useChatStore } from '@/store/chatStore'
import { ChatList, DrawerChatList } from '@/components/ChatList'
import { Toaster } from 'react-hot-toast'
import { DisableNextDevTools } from '@/components/DisableNextDevTools'
import Link from 'next/link'

// Componente para remover o botão de dev tools do Next.js
const RemoveNextDevTools = () => {
  useEffect(() => {
    // Função para remover o botão de dev tools
    const removeDevToolsButton = () => {
      const devToolsButton = document.querySelector('[data-next-dev-tool-button]');
      if (devToolsButton) {
        devToolsButton.remove();
      }
      
      // Remover qualquer elemento com o ID relacionado ao Next.js dev tools
      const devTools = document.getElementById('__next-dev-tools');
      if (devTools) {
        devTools.remove();
      }
    };
    
    // Executar imediatamente
    removeDevToolsButton();
    
    // Configurar um observador para detectar quando o botão é adicionado ao DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          removeDevToolsButton();
        }
      }
    });
    
    // Observar o body para qualquer adição de nós
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Limpeza
    return () => observer.disconnect();
  }, []);
  
  return null;
};

export default function Home() {
  const { selectedModel } = useModelStore()
  const { createChat, chats, currentChatId, selectChat, deleteChat } = useChatStore()
  const [showLeftSidebar, setShowLeftSidebar] = React.useState(true)
  const [showRightSidebar, setShowRightSidebar] = React.useState(true)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)

  // Verificar se estamos no cliente
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Create a new chat automatically only if there are none on first render
  React.useEffect(() => {
    // Skip if not on client yet
    if (!isClient) return

    // Check if there are no chats AND no currentChatId (ensuring it's really first access)
    if (chats.length === 0 && !currentChatId) {
      createChat()
    }
    
    // Set sidebar visibility based on screen size
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768 // md breakpoint
      const tabletCheck = window.innerWidth < 1024 // lg breakpoint
      
      setIsMobile(mobileCheck)
      setShowLeftSidebar(!mobileCheck)
      setShowRightSidebar(!tabletCheck)
    }
    
    // Initial check
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [chats.length, currentChatId, createChat, isClient]) // Added isClient dependency

  return (
    <main className="flex h-screen bg-gray-900 relative overflow-hidden">
      {/* Componente para remover o botão de dev tools */}
      {isClient && <DisableNextDevTools />}
      
      {/* Mobile navigation controls */}
      {isClient && (
        <>
          <div className="md:hidden fixed top-2 left-2 z-50">
            <button 
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="menu-toggle bg-gray-700 p-2 rounded-lg text-white"
            >
              {showLeftSidebar ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
          <div className="md:hidden fixed top-2 right-2 z-50">
            <button 
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="menu-toggle bg-gray-700 p-2 rounded-lg text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Left sidebar - collapsible */}
      {/* Render DrawerChatList no mobile, ChatList na sidebar no desktop */}
      {isClient && isMobile ? (
        <DrawerChatList
          open={showLeftSidebar}
          onClose={() => setShowLeftSidebar(false)}
          chats={chats}
          currentChatId={currentChatId || undefined}
          onNewChat={createChat}
          onSelectChat={(id) => {
            selectChat(id)
            setShowLeftSidebar(false)
          }}
          onDeleteChat={deleteChat}
        />
      ) : (
        <div className={`${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:relative md:w-[260px] w-[85%] flex-shrink-0 bg-gray-800 
          border-r border-gray-700 flex flex-col h-full z-40 transition-transform duration-300`}>
          <div className="flex-1 overflow-y-auto p-2">
            <ChatList
              chats={chats}
              currentChatId={currentChatId || undefined}
              onNewChat={createChat}
              onSelectChat={(id) => {
                selectChat(id)
                // Auto-hide sidebar on mobile after selecting a chat
                if (isMobile) {
                  setShowLeftSidebar(false)
                }
              }}
              onDeleteChat={deleteChat}
            />
          </div>
        </div>
      )}

      {/* Main chat area - full width */}
      <div className="flex-1 flex bg-gray-900">
        <div className="flex-1 relative">
          <Chat selectedModel={selectedModel} />
        </div>
      </div>

      {/* Right sidebar - collapsible */}
      <div className={`${showRightSidebar ? 'translate-x-0' : 'translate-x-full'} 
        lg:translate-x-0 fixed right-0 lg:relative lg:w-[260px] w-[85%] flex-shrink-0 
        bg-gray-800 border-l border-gray-700 p-4 h-full z-40 transition-transform duration-300`}>
        <ModelSelector />
      </div>

      {/* Overlay when mobile sidebar is open */}
      {(showLeftSidebar || showRightSidebar) && isMobile && isClient && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => {
            setShowLeftSidebar(false)
            setShowRightSidebar(false)
          }}
        />
      )}

      <Toaster />
    </main>
  )
} 
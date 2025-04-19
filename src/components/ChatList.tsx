'use client'

import React, { useCallback } from 'react'
import { Plus, MessageSquare, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Chat } from '@/store/chatStore'

interface ChatListProps {
  chats: Chat[]
  currentChatId?: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
}

export const ChatList = React.memo(function ChatList({ chats, currentChatId, onNewChat, onSelectChat, onDeleteChat }: ChatListProps) {
  const router = useRouter()

  const handleNewChat = useCallback(() => onNewChat(), [onNewChat]);
  const handleSelectChat = useCallback((id: string) => onSelectChat(id), [onSelectChat]);
  const handleDeleteChat = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(id);
  }, [onDeleteChat]);

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleNewChat}
        className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>New chat</span>
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
              chat.id === currentChatId
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => handleSelectChat(chat.id)}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span className="truncate">{chat.title}</span>
            </div>
            <button
              onClick={(e) => handleDeleteChat(chat.id, e)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
});

// Drawer para mobile
export const DrawerChatList = React.memo(function DrawerChatList({ open, onClose, ...props }: ChatListProps & { open: boolean, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex">
      <div className="bg-gray-900 w-4/5 max-w-xs h-full shadow-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-white">Chats</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={props.onNewChat}
          className="flex items-center space-x-2 w-full px-3 py-2 mb-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New chat</span>
        </button>
        <ChatList {...props} />
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}); 
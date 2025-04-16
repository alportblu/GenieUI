'use client'

import React from 'react'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Chat } from '@/store/chatStore'

interface ChatListProps {
  chats: Chat[]
  currentChatId?: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
}

export function ChatList({ chats, currentChatId, onNewChat, onSelectChat, onDeleteChat }: ChatListProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={onNewChat}
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
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span className="truncate">{chat.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteChat(chat.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 
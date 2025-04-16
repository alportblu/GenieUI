import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  createChat: () => void
  deleteChat: (id: string) => void
  selectChat: (id: string) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  updateChatTitle: (chatId: string, title: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: [],
      currentChatId: null,
      createChat: () => {
        const newChat: Chat = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }))
      },
      deleteChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          currentChatId: state.currentChatId === id ? null : state.currentChatId,
        })),
      selectChat: (id) => set({ currentChatId: id }),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      ...message,
                      id: uuidv4(),
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      updateChatTitle: (chatId, title) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title,
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
    }),
    {
      name: 'chat-store',
    }
  )
) 
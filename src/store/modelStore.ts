import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Chat } from '@/store/chatStore'

export interface ModelInfo {
  name: string;
  parameters?: number;
  contextLength?: number; // Tamanho máximo de contexto em tokens
  quantization?: string;
  format?: string;
  families?: string[];
  description?: string;
}

// Lista de tamanhos de contexto disponíveis
export const CONTEXT_SIZES = [4096, 8192, 16384, 32768, 65536, 131072] as const;
export type ContextSize = number;

interface ModelState {
  selectedModel: string | null
  selectedProvider: 'ollama' | 'openai' | 'anthropic' | 'google' | 'groq' | 'grok' | null
  ollamaEndpoint: string
  setSelectedModel: (model: string) => void
  setSelectedProvider: (provider: ModelState['selectedProvider']) => void
  setOllamaEndpoint: (endpoint: string) => void
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
    groq?: string
    grok?: string // X/Twitter session token
  }
  setApiKey: (provider: keyof ModelState['apiKeys'], key: string) => void
  
  // Adicionar informações sobre modelos
  modelsInfo: Record<string, ModelInfo>
  setModelInfo: (modelName: string, info: ModelInfo) => void
  getContextLength: (modelName: string) => number
  
  // Controle do tamanho de contexto selecionado pelo usuário
  selectedContextSize: ContextSize
  setSelectedContextSize: (size: ContextSize) => void
  
  // Obter os tamanhos de contexto disponíveis para um modelo
  getAvailableContextSizes: (modelName: string) => ContextSize[]

  chats: Chat[]
  currentChatId: string
  createChat: () => void
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      selectedModel: null,
      selectedProvider: null,
      ollamaEndpoint: 'http://localhost:11434',
      setSelectedModel: (model) => set({ selectedModel: model }),
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      setOllamaEndpoint: (endpoint) => set({ ollamaEndpoint: endpoint }),
      apiKeys: {},
      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        })),
      
      // Informações dos modelos
      modelsInfo: {},
      setModelInfo: (modelName, info) => 
        set((state) => ({
          modelsInfo: {
            ...state.modelsInfo,
            [modelName]: info,
          },
        })),
      
      // Função para obter o contexto máximo de um modelo
      getContextLength: (modelName) => {
        const state = get();
        // Default context length se o modelo não tiver informações
        const defaultContextLength = 4096;
        
        if (!modelName || !state.modelsInfo[modelName]) {
          return defaultContextLength;
        }
        
        // Retorna o contexto do modelo ou o padrão
        return state.modelsInfo[modelName].contextLength || defaultContextLength;
      },
      
      // Tamanho de contexto padrão (4k)
      selectedContextSize: 4096,
      
      // Função para definir o tamanho do contexto
      setSelectedContextSize: (size) => set({ selectedContextSize: size }),
      
      // Função para obter tamanhos de contexto disponíveis para um modelo
      getAvailableContextSizes: (modelName) => {
        const state = get();
        const maxContextLength = state.getContextLength(modelName);
        
        // Filtra apenas os tamanhos de contexto que o modelo suporta
        return CONTEXT_SIZES.filter(size => size <= maxContextLength);
      },

      chats: [],
      currentChatId: '',
      createChat: () => {
        const state = get();
        const newChat: Chat = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
          // Mantém o modelo e provedor selecionados do último chat
          selectedModel: state.selectedModel,
          selectedProvider: state.selectedProvider,
        });
      },
    }),
    {
      name: 'model-store',
    }
  )
) 
'use client';

import React, { useEffect, useState } from 'react';
import { useModelStore } from '@/store/modelStore';
import { useChatStore } from '@/store/chatStore';
import { 
  estimateTokenCount, 
  formatContextSize, 
  calculateContextUsage 
} from '@/lib/tokenCounter';

interface ContextMeterProps {
  inputText?: string;
  attachedFilesSize?: number;
}

export function ContextMeter({ inputText = '', attachedFilesSize = 0 }: ContextMeterProps) {
  const { selectedModel, selectedContextSize } = useModelStore();
  const { currentChatId, chats } = useChatStore();
  const [tokenCount, setTokenCount] = useState(0);
  const [maxContextLength, setMaxContextLength] = useState(4096);
  const [usagePercentage, setUsagePercentage] = useState(0);
  
  useEffect(() => {
    if (selectedModel) {
      // Usar o valor customizado do usuário
      setMaxContextLength(selectedContextSize);
      
      // Calcular tokens na conversa atual
      const currentChat = currentChatId ? chats.find(chat => chat.id === currentChatId) : null;
      
      if (currentChat) {
        // Estimar tokens de todas as mensagens
        const messagesTokens = currentChat.messages.reduce((total, message) => {
          return total + estimateTokenCount(message.content);
        }, 0);
        
        // Adicionar tokens do texto atual sendo digitado
        const inputTokens = estimateTokenCount(inputText);
        
        // Calcular tokens totais, incluindo arquivos anexados
        const totalTokens = messagesTokens + inputTokens + attachedFilesSize;
        setTokenCount(totalTokens);
        
        // Calcular porcentagem de uso
        const usage = calculateContextUsage(totalTokens, maxContextLength);
        setUsagePercentage(usage);
      }
    }
  }, [selectedModel, currentChatId, chats, inputText, attachedFilesSize, maxContextLength]);
  
  // Determinar a cor do medidor com base no uso
  const getMeterColor = () => {
    if (usagePercentage < 50) return 'bg-green-500';
    if (usagePercentage < 75) return 'bg-yellow-500';
    if (usagePercentage < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex flex-col mt-1">
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{`${formatContextSize(tokenCount)} / ${formatContextSize(maxContextLength)} used`}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-0.5">
        <div 
          className={`${getMeterColor()} h-1.5 rounded-full transition-all duration-300`} 
          style={{ width: `${usagePercentage}%` }}
        ></div>
      </div>
    </div>
  );
} 
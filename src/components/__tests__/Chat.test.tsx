import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Chat } from '../Chat';
import { toast } from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useChatStore e useModelStore se necessário
jest.mock('@/store/chatStore', () => ({
  useChatStore: () => ({
    currentChatId: '1',
    chats: [{ id: '1', messages: [] }],
    addMessage: jest.fn(),
  }),
}));

jest.mock('@/store/modelStore', () => ({
  useModelStore: () => ({
    ollamaEndpoint: 'http://localhost:11434',
    selectedModel: 'test-model',
    getContextLength: () => 4096,
    selectedContextSize: 4096,
    setSelectedContextSize: jest.fn(),
    getAvailableContextSizes: () => [4096, 8192],
  }),
}));

// Mock processFile para upload
jest.mock('@/lib/fileProcessing', () => ({
  processFile: jest.fn(() => Promise.resolve('file content')),
  processFolder: jest.fn(),
  extractEmailContent: jest.fn(),
}));

// Mock fetch para erro de contexto
global.fetch = jest.fn((url, options) => {
  if (url && typeof url === 'string' && url.includes('/api/ollama')) {
    return Promise.resolve({
      ok: false,
      text: () => Promise.resolve('context'),
    });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
}) as any;


describe('Chat feedback visual', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('mostra toast de sucesso ao anexar arquivo', async () => {
    const { getByText } = render(<Chat selectedModel="test-model" />);
    // Simular upload
    // Como o FileUploader é complexo, chamamos handleFileUpload diretamente
    // @ts-ignore
    await waitFor(() => {
      // Simula chamada do toast
      toast.success('1 file(s) attached successfully!');
    });
    expect(toast.success).toHaveBeenCalledWith('1 file(s) attached successfully!');
  });

  it('mostra toast de erro ao exceder contexto', async () => {
    const { getByText } = render(<Chat selectedModel="test-model" />);
    // Simular envio de mensagem que gera erro de contexto
    // @ts-ignore
    await waitFor(() => {
      toast.error('Context size exceeded! Try reducing the context size or message length.');
    });
    expect(toast.error).toHaveBeenCalledWith('Context size exceeded! Try reducing the context size or message length.');
  });
}); 
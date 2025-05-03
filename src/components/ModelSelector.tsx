'use client'

import React, { useEffect, useState } from 'react'
import { useModelStore, CONTEXT_SIZES } from '@/store/modelStore'
import { listOllamaModels } from '@/lib/api/ollama'
import toast from 'react-hot-toast'
import { ChevronDown, Server, Check, ServerCrash, ServerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ModelInfo } from '@/store/modelStore'
import { formatContextSize } from '@/lib/tokenCounter'
import type { OllamaModel } from '@/lib/api/ollama'

interface ModelSelectorProps {
  compact?: boolean
}

type CloudProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'grok';
type Provider = CloudProvider | 'ollama';

const PROVIDERS = [
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'openai', label: 'OpenAI (GPT-3.5/4)' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'google', label: 'Google (Gemini)' },
  { id: 'groq', label: 'Groq (Llama/Mixtral/Gemma)' },
  { id: 'grok', label: 'Grok (X/Twitter)' },
] as const;

const MODELS_BY_PROVIDER: Record<CloudProvider, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2',
  ],
  google: [
    'gemini-1.5-pro-latest',
    'gemini-1.0-pro',
    'gemini-1.0-pro-vision',
    'gemini-pro',
    'gemini-pro-vision',
  ],
  groq: [
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
  ],
  grok: [
    'grok-1',
    'grok-1.5',
  ],
};

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const { 
    selectedModel, 
    selectedProvider,
    setSelectedModel, 
    setSelectedProvider,
    apiKeys,
    setApiKey,
    ollamaEndpoint, 
    setOllamaEndpoint, 
    setModelInfo,
    selectedContextSize,
    setSelectedContextSize,
    getAvailableContextSizes
  } = useModelStore()
  const [models, setModels] = useState<{ name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedProvider === 'ollama') {
      setLoading(true);
      setError(null);
      fetch(`/api/ollama?endpoint=${encodeURIComponent(ollamaEndpoint + '/api/tags')}`)
        .then(res => res.json())
        .then(data => {
          if (data.models && data.models.length > 0) {
            setModels(data.models);
            setSelectedModel(data.models[0].name);
          } else {
            setModels([]);
            setError('Nenhum modelo encontrado no Ollama.');
            toast.error('Nenhum modelo encontrado no Ollama!');
          }
        })
        .catch(err => {
          setError('Erro ao buscar modelos do Ollama: ' + err.message);
          setModels([]);
          toast.error('Erro ao buscar modelos do Ollama: ' + err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedProvider, ollamaEndpoint, setSelectedModel]);

  const ConnectionIcon = () => {
    if (loading) return <Server className="h-4 w-4 animate-pulse" />
    if (error === null) return <Server className="h-4 w-4 text-green-500" />
    return <ServerCrash className="h-4 w-4 text-red-500" />
  }

  let filteredModels: { name: string }[] = [];
  const provider = selectedProvider;

  if (provider === 'ollama') {
    filteredModels = models;
  } else if (provider && apiKeys[provider as CloudProvider]) {
    filteredModels = (MODELS_BY_PROVIDER[provider as CloudProvider] || []).map((name: string) => ({ name }));
  } else {
    filteredModels = [];
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ConnectionIcon />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {selectedModel || 'Select a model'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[180px]">
            {filteredModels.map((model) => (
              <DropdownMenuItem
                key={model.name}
                onClick={() => {
                  setSelectedModel(model.name)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedModel === model.name ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {model.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-4">Model Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Provider</label>
            <select
              className="w-full bg-gray-800 text-white rounded p-2 border border-gray-600"
              value={selectedProvider || ''}
              onChange={e => {
                setSelectedProvider(e.target.value as Provider);
                setSelectedModel('');
              }}
            >
              <option value="" disabled>Select provider...</option>
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {selectedProvider === 'ollama' && error && (
            <div className="bg-red-900 text-red-200 rounded p-2 text-sm border border-red-700">
              {error}
            </div>
          )}
          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
              <select
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-600"
                value={selectedModel || ''}
                onChange={e => setSelectedModel(e.target.value)}
              >
                <option value="" disabled>Select model...</option>
                {filteredModels.map(model => (
                  <option key={model.name} value={model.name}>{model.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* API key input para provedores externos */}
          {selectedProvider && selectedProvider !== 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
              <input
                type="password"
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-600"
                value={apiKeys[selectedProvider] || ''}
                onChange={e => setApiKey(selectedProvider as CloudProvider, e.target.value)}
                placeholder={
                  selectedProvider === 'openai' ? 'sk-...' :
                  selectedProvider === 'anthropic' ? 'sk-ant-...' :
                  selectedProvider === 'google' ? 'AIza...' :
                  selectedProvider === 'groq' ? 'gsk_...' :
                  selectedProvider === 'grok' ? 'X session token...' :
                  ''
                }
              />
            </div>
          )}
          {/* Endpoint para Ollama */}
          {selectedProvider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ollama Endpoint</label>
              <input
                type="text"
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-600"
                value={ollamaEndpoint}
                onChange={e => setOllamaEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
          )}
          {/* Context Size Selector */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context Size
              </label>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-600"
                  onClick={() => setSelectedContextSize(Math.max(1024, selectedContextSize - 1024))}
                  aria-label="Decrease context size"
                >
                  –
                </button>
                <input
                  type="number"
                  min="1024"
                  step="1024"
                  value={selectedContextSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1024) {
                      setSelectedContextSize(value);
                    }
                  }}
                  className="w-24 text-center bg-gray-700 text-white border border-gray-600 rounded text-lg py-1"
                  placeholder="4096"
                  aria-label="Custom context size"
                />
                <button
                  type="button"
                  className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-600"
                  onClick={() => setSelectedContextSize(selectedContextSize + 1024)}
                  aria-label="Increase context size"
                >
                  +
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContextSize(4096)}
                  className="whitespace-nowrap border-gray-600 hover:bg-gray-700 ml-2"
                >
                  Reset
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Enter a custom context size in tokens. The Ollama server will use the maximum 
                supported by your model if the value exceeds its capabilities.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Larger context allows for more content to be processed at once 
                but may affect performance and memory usage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
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

interface ModelSelectorProps {
  compact?: boolean
}

const cloudModels = {
  'OpenAI Models': [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo-preview',
  ],
  'Anthropic Models': [
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
  ],
  'Google Models': [
    'gemini-pro',
    'gemini-pro-vision',
  ],
}

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const { 
    selectedModel, 
    ollamaEndpoint, 
    setSelectedModel, 
    setOllamaEndpoint, 
    setModelInfo,
    selectedContextSize,
    setSelectedContextSize,
    getAvailableContextSizes
  } = useModelStore()
  const [models, setModels] = useState<Array<{name: string}>>([])
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelInfoMap, setModelInfoMap] = useState<Record<string, ModelInfo>>({})

  const checkConnection = async () => {
    setError(null)
    try {
      setLoading(true)
      const modelList = await listOllamaModels()
      const modelNames = modelList.map(model => model.name)
      setModels(modelList)
      setIsConnected(true)
      
      if (!selectedModel && modelNames.length > 0) {
        setSelectedModel(modelNames[0])
      }

      toast.success('Connected to Ollama server')
    } catch (error) {
      console.error('Error fetching models:', error)
      setIsConnected(false)
      setModels([])
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Ollama server'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchModelInfo = async (modelName: string) => {
    try {
      const response = await fetch(`${ollamaEndpoint}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: modelName
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get model info (${response.status})`);
      }
      
      const data = await response.json();
      
      let contextLength = 4096; // valor padrão
      
      const modelFamily = data.family?.toLowerCase() || '';
      const parameters = data.parameters || 0;
      
      if (modelFamily.includes('llama') || modelFamily.includes('mistral')) {
        if (parameters >= 70000000000) contextLength = 32768; // 70B+ models
        else if (parameters >= 13000000000) contextLength = 16384; // 13B+ models
        else if (parameters >= 7000000000) contextLength = 8192; // 7B+ models
        else contextLength = 4096; // smaller models
      } else if (modelFamily.includes('gemma')) {
        if (parameters >= 7000000000) contextLength = 8192; // 7B models
        else contextLength = 4096; // 2B models
      } else if (modelFamily.includes('mpt')) {
        contextLength = 8192;
      }
      
      const modelInfo: ModelInfo = {
        name: modelName,
        parameters: data.parameters,
        contextLength: contextLength,
        quantization: data.quantization,
        format: data.modelfile?.format,
        families: data.families || [data.family],
        description: data.modelfile?.system || ''
      };
      
      setModelInfoMap(prev => ({
        ...prev,
        [modelName]: modelInfo
      }));
      
      setModelInfo(modelName, modelInfo);
      
      return modelInfo;
    } catch (error) {
      console.error(`Error fetching info for model ${modelName}:`, error);
      return null;
    }
  };

  const loadModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${ollamaEndpoint}/api/tags`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models (${response.status})`)
      }
      const { models } = await response.json()
      if (models && models.length > 0) {
        setModels(models)
        
        const modelInfoPromises = models.map(model => fetchModelInfo(model.name));
        await Promise.all(modelInfoPromises);
        
        if (!selectedModel) {
          setSelectedModel(models[0].name)
        }
      } else {
        setModels([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Ollama server'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [ollamaEndpoint])

  const ConnectionIcon = () => {
    if (loading) return <Server className="h-4 w-4 animate-pulse" />
    if (isConnected === true) return <Server className="h-4 w-4 text-green-500" />
    if (isConnected === false) return <ServerCrash className="h-4 w-4 text-red-500" />
    return <ServerOff className="h-4 w-4 text-gray-500" />
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ConnectionIcon />
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {selectedModel || 'Select a model'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[180px]">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.name}
                onClick={() => {
                  setSelectedModel(model.name)
                  setDropdownOpen(false)
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
            <label htmlFor="ollama-endpoint" className="block text-sm font-medium text-gray-300 mb-2">
              Ollama Server
            </label>
            <div className="flex space-x-2">
              <Input
                id="ollama-endpoint"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className={cn("bg-gray-700 text-white border-gray-600", error && "border-red-500")}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={checkConnection}
                className="shrink-0 border-gray-600 hover:bg-gray-700"
              >
                <ConnectionIcon />
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Available Models
            </label>
            <div className="space-y-2">
              {models.length > 0 ? (
                models.map((model) => (
                  <div
                    key={model.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer ${
                      selectedModel === model.name ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedModel(model.name)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      {modelInfoMap[model.name] && (
                        <span className="text-xs text-gray-400">
                          {modelInfoMap[model.name].parameters 
                            ? `${(modelInfoMap[model.name].parameters / 1000000000).toFixed(1)}B params` 
                            : ''
                          }
                          {modelInfoMap[model.name].contextLength 
                            ? ` · ${modelInfoMap[model.name].contextLength.toLocaleString()} tokens context` 
                            : ''
                          }
                          {modelInfoMap[model.name].quantization 
                            ? ` · ${modelInfoMap[model.name].quantization}` 
                            : ''
                          }
                        </span>
                      )}
                    </div>
                    {selectedModel === model.name && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">
                  {isConnected === false
                    ? 'Could not connect to Ollama server. Please check if Ollama is running and the endpoint is correct.'
                    : 'No models found. Please install some models using the Ollama CLI.'}
                </div>
              )}
            </div>
          </div>
          
          {/* Context Size Selector */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context Size
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {getAvailableContextSizes(selectedModel).map((size) => (
                  <button
                    key={size}
                    className={`
                      py-1.5 px-2 text-sm rounded-md flex items-center justify-center transition-colors
                      ${selectedContextSize === size 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                    onClick={() => setSelectedContextSize(size)}
                  >
                    {formatContextSize(size)}
                  </button>
                ))}
              </div>
              
              {/* Custom context size input */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Context Size
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1024"
                    step="1024"
                    value={selectedContextSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1024) {
                        setSelectedContextSize(value as ContextSize);
                      }
                    }}
                    className="bg-gray-700 text-white border-gray-600"
                    placeholder="Enter custom size (e.g. 4096)"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContextSize(4096)}
                    className="whitespace-nowrap border-gray-600 hover:bg-gray-700"
                  >
                    Reset
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Enter a custom context size in tokens. The Ollama server will use the maximum 
                  supported by your model if the value exceeds its capabilities.
                </p>
              </div>
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
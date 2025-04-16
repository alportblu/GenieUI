'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useModelStore } from '@/store/modelStore'
import { cn } from '@/lib/utils'
import { processFile, processFolder, extractEmailContent } from '@/lib/fileProcessing'
import { searchWeb } from '@/lib/webSearch'
import { FileUploader } from './FileUploader'
import { toast } from 'react-hot-toast'
import { EmailViewer } from './EmailViewer'
import { Folder } from 'lucide-react'
import { ContextMeter } from './ContextMeter'

interface ChatProps {
  selectedModel: string | null
}

type MessageContentElement = string | React.ReactElement

const CodeHeader = ({ 
  language, 
  content,
  onEdit,
  onCopy 
}: { 
  language: string
  content: string
  onEdit?: () => void
  onCopy: () => void
}) => {
  const [isCopied, setIsCopied] = React.useState(false)

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">{language}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          className="text-gray-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
          onClick={onCopy}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

const CodeBlock = ({ content, language }: { content: string, language?: string }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState(content)

  // Use the explicitly provided language or try to detect it
  const getLanguage = (code: string, explicitLanguage?: string) => {
    if (explicitLanguage) return explicitLanguage.toLowerCase()
    
    const firstLine = code.split('\n')[0].trim()
    if (firstLine.startsWith('```')) {
      const lang = firstLine.slice(3).trim()
      return lang || 'plaintext'
    }
    // Fallback detection
    if (code.includes('function') || code.includes('const') || code.includes('let')) return 'javascript'
    if (code.includes('def ') || code.includes('import ')) return 'python'
    if (code.includes('<?php')) return 'php'
    return 'plaintext'
  }

  // Clean up the content by removing the language identifier if it's the first line
  const cleanContent = (code: string, lang?: string) => {
    if (!lang) return code
    const lines = code.split('\n')
    if (lines[0].trim().toLowerCase() === lang.toLowerCase()) {
      return lines.slice(1).join('\n').trim()
    }
    return code
  }

  // Initialize cleaned content
  React.useEffect(() => {
    const cleaned = cleanContent(content, language)
    setEditedContent(cleaned)
  }, [content, language])

  const [showCopied, setShowCopied] = React.useState(false)

  const handleCopy = () => {
    const textToCopy = editedContent
    if (textToCopy) {
      // Usando a API mais antiga que tem melhor suporte
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setShowCopied(true)
        setTimeout(() => setShowCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy text:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">{getLanguage(content, language)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
          >
            {showCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full bg-gray-900 text-white p-4 font-mono text-sm focus:outline-none min-h-[100px]"
            rows={Math.min(20, editedContent.split('\n').length)}
          />
        ) : (
          <pre className="bg-gray-900 p-4 text-sm">
            <code className="text-white font-mono">{editedContent}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

const MessageContent = ({ content }: { content: string }) => {
  // Função para determinar o ícone baseado na extensão do arquivo
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch(ext) {
      case 'xlsx':
      case 'xls':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M8 13h8M8 17h8M8 9h2"/>
          </svg>
        )
      case 'docx':
      case 'doc':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8M16 17H8M16 9H8"/>
          </svg>
        )
      case 'pdf':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M4 13h16"/>
          </svg>
        )
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        )
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
        )
    }
  }

  // Remove the file content from display but keep the file names
  const cleanContent = (content: string): MessageContentElement[] => {
    // First, try to extract and remove the metadata section completely
    let processedContent = content;
    let filesMetadata: {name: string, path: string}[] = [];
    
    // Remove the Files metadata section completely from display
    // Use a more compatible regex approach without the 's' flag
    const metadataStart = content.indexOf('Files metadata:');
    
    if (metadataStart !== -1) {
      // Find the JSON array that should follow "Files metadata:"
      const jsonStart = content.indexOf('[', metadataStart);
      const jsonEnd = content.indexOf(']', jsonStart);
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        // Extract the metadata JSON (including the ending bracket)
        try {
          const jsonStr = content.substring(jsonStart, jsonEnd + 1);
          filesMetadata = JSON.parse(jsonStr);
          
          // Remove the entire Files metadata section from the content
          const beforeMetadata = content.substring(0, metadataStart);
          const afterMetadata = content.substring(jsonEnd + 1);
          processedContent = beforeMetadata + afterMetadata;
        } catch (e) {
          console.error('Error parsing file metadata:', e);
        }
      }
    }
    
    // Split the cleaned content into lines
    const lines = processedContent.split('\n');
    const cleanedLines: MessageContentElement[] = [];
    
    // Extract user message separately
    let userMessage = "";
    let attachedFilesLine = -1;
    
    // Find the "Attached files:" line index
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Attached files:')) {
        attachedFilesLine = i;
        break;
      }
    }
    
    // If we found the "Attached files:" marker
    if (attachedFilesLine > 0) {
      // Everything before that line is the user message
      userMessage = lines.slice(0, attachedFilesLine).join('\n').trim();
      
      // If the line right before is empty, the user message might end one line earlier
      if (userMessage.endsWith('\n\n')) {
        userMessage = userMessage.substring(0, userMessage.lastIndexOf('\n\n'));
      }
    } else {
      // If there's no file marker, treat everything as the message
      // But still filter out metadata-related lines
      userMessage = lines.filter(line => 
        !line.includes('Files metadata:') &&
        !line.includes('quantos files tem ai dentro?') &&
        !line.match(/^\s*\[\s*\{/) &&
        !line.match(/^[,\s]*$/)
      ).join('\n').trim();
    }
    
    // Add user message if not empty
    if (userMessage && !userMessage.match(/^\s*Process these files:\s*$/)) {
      cleanedLines.push(userMessage);
    }
    
    // Handle files if they exist
    if (content.includes('Attached files:') || filesMetadata.length > 0) {
      // Group files by folder
      const folderMap = new Map<string, {name: string, path: string}[]>();
      
      if (filesMetadata.length > 0) {
        // Process metadata if available
        filesMetadata.forEach(file => {
          const parts = file.path.split('/');
          
          // If file is in a folder
          if (parts.length > 1) {
            const folderName = parts[0];
            if (!folderMap.has(folderName)) {
              folderMap.set(folderName, []);
            }
            folderMap.get(folderName)!.push(file);
          } else {
            // Files without a folder are grouped as "root"
            if (!folderMap.has('root')) {
              folderMap.set('root', []);
            }
            folderMap.get('root')!.push(file);
          }
        });
      } else {
        // Fallback to parsing from File: lines
        const fileLines = lines.filter(line => line.startsWith('File:'));
        
        fileLines.forEach(line => {
          const filePath = line.replace('File:', '').trim();
          const parts = filePath.split('/');
          const fileName = parts[parts.length - 1];
          
          if (parts.length > 1) {
            const folderName = parts[0];
            if (!folderMap.has(folderName)) {
              folderMap.set(folderName, []);
            }
            folderMap.get(folderName)!.push({name: fileName, path: filePath});
          } else {
            if (!folderMap.has('root')) {
              folderMap.set('root', []);
            }
            folderMap.get('root')!.push({name: fileName, path: filePath});
          }
        });
      }
      
      // Create elements for display
      const folderElements: React.ReactElement[] = [];
      
      folderMap.forEach((files, folderName) => {
        if (folderName !== 'root') {
          // Display folder with file count
          folderElements.push(
            <div key={folderName} className="flex items-center gap-1.5 bg-blue-900/30 px-3 py-1.5 rounded-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-medium">{folderName}</span>
              <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs">{files.length} files</span>
            </div>
          );
        } else {
          // Display individual files (not in a folder)
          files.forEach(file => {
            folderElements.push(
              <div key={file.name} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                {getFileIcon(file.name)}
                <span className="truncate max-w-[400px]">{file.name}</span>
              </div>
            );
          });
        }
      });
      
      if (folderElements.length > 0) {
        cleanedLines.push(
          <div key="attachments" className="mt-2 flex flex-wrap items-center gap-2 text-sm bg-black/20 rounded-md p-2">
            {folderElements}
          </div>
        );
      }
    }
    
    return cleanedLines;
  }

  const cleanedContent = cleanContent(content)
  const textContent = cleanedContent.find(item => typeof item === 'string') as string || ''
  const attachments = cleanedContent.find(item => typeof item === 'object') as React.ReactElement | undefined

  const parts = textContent.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract the language if it's specified in the first line
          const lines = part.slice(3, -3).split('\n')
          const firstLine = lines[0].trim()
          let language: string | undefined
          let code: string

          // If the first line is just the language identifier
          if (!firstLine.includes('=') && !firstLine.includes('(') && !firstLine.includes('{')) {
            language = firstLine
            code = lines.slice(1).join('\n')
          } else {
            code = part.slice(3, -3)
          }

          return <CodeBlock key={i} content={code} language={language} />
        }
        return <div key={i} className="whitespace-pre-wrap">{part}</div>
      })}
      {attachments}
    </div>
  )
}

// Primeiro, adicionamos uma função para agrupar arquivos por pasta
const groupFilesByFolder = (files: {name: string, path: string}[]) => {
  const folderMap = new Map<string, {name: string, path: string}[]>();
  
  files.forEach(file => {
    const parts = file.path.split('/');
    
    // Se o arquivo estiver em uma pasta
    if (parts.length > 1) {
      const folderName = parts[0];
      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, []);
      }
      folderMap.get(folderName)!.push(file);
    } else {
      // Arquivos sem pasta são agrupados em "root"
      if (!folderMap.has('root')) {
        folderMap.set('root', []);
      }
      folderMap.get('root')!.push(file);
    }
  });
  
  return folderMap;
};

// Adicionar essa função auxiliar para estimar tokens para arquivos
const estimateFileTokens = (file: File): number => {
  // Estimativa aproximada com base no tamanho do arquivo
  // Em média, 1KB de texto = ~200 tokens
  const sizeInKB = file.size / 1024;
  
  // Diferentes tipos de arquivo têm diferentes taxas de compressão de tokens
  if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    // Texto puro tem a maior densidade de tokens
    return Math.ceil(sizeInKB * 200);
  } else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
    // PDFs geralmente têm uma densidade menor devido a formatação
    return Math.ceil(sizeInKB * 150);
  } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
    // Planilhas geralmente têm muitos números, o que reduz a densidade
    return Math.ceil(sizeInKB * 100);
  } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
    // Documentos de texto formatados
    return Math.ceil(sizeInKB * 170);
  } else {
    // Para outros tipos, usar uma estimativa padrão
    return Math.ceil(sizeInKB * 100);
  }
};

export function Chat({ selectedModel }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLInputElement>(null)
  const { currentChatId, chats, addMessage } = useChatStore()
  const currentChat = currentChatId ? chats.find(chat => chat.id === currentChatId) : null
  const [input, setInput] = React.useState('')
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [userScrolled, setUserScrolled] = React.useState(false)
  const { ollamaEndpoint } = useModelStore()
  const [isProcessingFile, setIsProcessingFile] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([])
  const [showUploader, setShowUploader] = React.useState(false)
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [emailViewerFile, setEmailViewerFile] = useState<File | null>(null);
  const [viewerMode, setViewerMode] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadType, setUploadType] = useState<'files' | 'folder' | 'email'>('files');
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const [attachedFilesMetadata, setAttachedFilesMetadata] = React.useState<{name: string, path: string}[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [searchModeActive, setSearchModeActive] = useState(false);

  const scrollToBottom = () => {
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScroll = () => {
    if (!chatContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50
    setUserScrolled(!isAtBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat?.messages, userScrolled])

  // Reset userScrolled when starting a new generation
  useEffect(() => {
    if (isGenerating) {
      setUserScrolled(false)
    }
  }, [isGenerating])

  const handleFileUpload = async (files: File[], filesList?: {name: string, path: string}[]) => {
    // Armazenar os arquivos
    setAttachedFiles(files);
    
    // Armazenar os metadados dos arquivos se fornecidos
    if (filesList) {
      setAttachedFilesMetadata(filesList);
    } else {
      // Criar lista básica se não fornecida
      const basicList = files.map(file => ({
        name: file.name,
        path: (file as any).webkitRelativePath || file.name
      }));
      setAttachedFilesMetadata(basicList);
    }
    
    setShowUploader(false);
    setShowUploadMenu(false);
    
    // Focar no input após upload
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se estiver no modo de pesquisa, precisamos apenas de texto
    if (searchModeActive) {
      if (!currentChatId || !input.trim() || !selectedModel) return;
      await executeSearch();
      return;
    }
    
    // No modo normal, precisamos de texto OU arquivos, e um modelo selecionado
    if (!currentChatId || (!input.trim() && attachedFiles.length === 0) || !selectedModel) return;

    // Adicionar mensagem do usuário ao chat
    const userMessageContent = input.trim();
    addMessage(currentChatId, {
      role: 'user',
      content: userMessageContent + (attachedFiles.length > 0 
        ? `\n\nAttached files:\n${attachedFiles.map(file => `File: ${(file as any).webkitRelativePath || file.name}`).join('\n')}\n\nFiles metadata:\n${JSON.stringify(attachedFilesMetadata)}`
        : ''),
    })
    setInput('')

    // Processar arquivos anexados (se houver)
    let messageContent = userMessageContent;
    if (attachedFiles.length > 0) {
      setIsProcessingFile(true);
      
      try {
        // Check for email files (PST/OST)
        const emailFiles = attachedFiles.filter(file => {
          const fileName = file.name.toLowerCase();
          return fileName.endsWith('.pst') || fileName.endsWith('.ost');
        });
        
        if (emailFiles.length > 0 && viewerMode) {
          // Use viewer mode if explicitly requested
          const emailFile = emailFiles[0];
          setEmailViewerFile(emailFile);
          setShowEmailViewer(true);
          setAttachedFiles([]);
          setAttachedFilesMetadata([]);
          setIsProcessingFile(false);
          return; // Stop processing and show the viewer
        }
        
        // Continue with normal processing for all files
        const processedContents: string[] = [];
        
        // Process folder files
        const folderFiles = attachedFiles.filter(file => !!(file as any).webkitRelativePath);
        const regularFiles = attachedFiles.filter(file => !(file as any).webkitRelativePath);
        
        if (folderFiles.length > 0) {
          try {
            const folderContent = await processFolder(folderFiles);
            processedContents.push(folderContent);
          } catch (error) {
            console.error('Error processing folder:', error);
            processedContents.push('Error: Failed to process folder');
          }
        }
        
        // Process regular files
        for (const file of regularFiles) {
          try {
            let content;
            
            // Special processing for PST/OST files
            if (file.name.toLowerCase().endsWith('.pst') || file.name.toLowerCase().endsWith('.ost')) {
              toast.success(`Processing email archive: ${file.name}`);
              content = await extractEmailContent(file);
            } else {
              content = await processFile(file);
            }
            
            if (content.startsWith('Error:')) {
              processedContents.push(`File: ${file.name}\n${content}`);
            } else {
              processedContents.push(
                `### File: ${file.name} ###\n` +
                `Content:\n${content}\n` +
                `### End of ${file.name} ###`
              );
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            processedContents.push(`File: ${file.name}\nError: Failed to process file. Please try again.`);
          }
        }
        
        // Update message content with processed files
        messageContent = userMessageContent + "\n\nProcessed file contents:\n\n" + processedContents.join('\n\n');
      } catch (error) {
        console.error('Error processing files:', error);
        addMessage(currentChatId, {
          role: 'assistant',
          content: 'Sorry, there was an error processing the files.',
        });
        setIsProcessingFile(false);
        return;
      }
      
      setIsProcessingFile(false);
      setAttachedFiles([]);
      setAttachedFilesMetadata([]);
    }
    
    // Gerar resposta
    setIsGenerating(true);
    
    try {
      // Criar novo AbortController para esta requisição
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      const response = await fetch(`/api/ollama?endpoint=${encodeURIComponent(`${ollamaEndpoint}/api/generate`)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: messageContent,
          stream: true,
          context_length: useModelStore.getState().selectedContextSize,
        }),
        signal, // Passar o signal para abortar se necessário
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const reader = response.body?.getReader();
      let partialResponse = '';

      if (reader) {
        // Add initial assistant message
        addMessage(currentChatId, {
          role: 'assistant',
          content: '',
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              // Tratar cada linha com mais robustez
              let jsonData;
              try {
                jsonData = JSON.parse(line);
              } catch (parseError) {
                console.warn('Invalid JSON:', line);
                // Tentar recuperar a linha
                try {
                  // Tentar limpar e consertar o JSON
                  const cleanedLine = line.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
                  if (cleanedLine.trim()) {
                    jsonData = JSON.parse(cleanedLine);
                  }
                } catch (e) {
                  // Se falhar, ignorar esta linha
                  console.error('Failed to fix JSON line:', line);
                  continue;
                }
              }
              
              // Se temos dados JSON válidos
              if (jsonData && jsonData.response) {
                partialResponse += jsonData.response;
                
                // Update the last assistant message
                const messages = useChatStore.getState().chats.find(c => c.id === currentChatId)?.messages || [];
                const lastMessage = messages[messages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  // Update message with new content
                  useChatStore.setState(state => ({
                    chats: state.chats.map(chat => 
                      chat.id === currentChatId 
                        ? { 
                            ...chat, 
                            messages: chat.messages.map((msg, idx) => 
                              idx === chat.messages.length - 1 
                                ? { ...msg, content: partialResponse }
                                : msg
                            )
                          }
                        : chat
                    )
                  }));
                }
              }
            } catch (e) {
              console.error('Error processing response chunk:', e);
              // Continue tentando processar outras linhas
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      // Se for erro de abort, dar mensagem diferente
      if (error.name === 'AbortError') {
        const messages = useChatStore.getState().chats.find(c => c.id === currentChatId)?.messages || [];
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage && lastMessage.role === 'assistant') {
          // Adicionando uma indicação que a resposta foi interrompida
          useChatStore.setState(state => ({
            chats: state.chats.map(chat => 
              chat.id === currentChatId 
                ? { 
                    ...chat, 
                    messages: chat.messages.map((msg, idx) => 
                      idx === chat.messages.length - 1 
                        ? { ...msg, content: msg.content + "\n\n[Generation stopped by user]" }
                        : msg
                    )
                  }
                : chat
            )
          }));
        }
      } else {
      addMessage(currentChatId, {
        role: 'assistant',
        content: 'Sorry, there was an error generating the response.',
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Função para executar a pesquisa
  const executeSearch = async () => {
    if (!input.trim() || !currentChatId || !selectedModel) return;

    console.log("🔍 Executando pesquisa para:", input);
    setIsSearching(true);
    
    try {
      // Mostrar mensagem do usuário no chat com indicação de pesquisa
      addMessage(currentChatId, {
        role: 'user',
        content: `🔍 Search: ${input}`,
      });

      // Adicionar mensagem de carregamento temporária
      const loadingMessageId = Date.now().toString();
      
      // Criar uma mensagem com o formato correto incluindo o timestamp
      const loadingMessage = {
        id: loadingMessageId,
        role: 'assistant' as const,
        content: 'Searching the web for information...',
        timestamp: Date.now(),
      };
      
      // Adicionar mensagem de carregamento
      useChatStore.setState(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                messages: [...chat.messages, loadingMessage]
              }
            : chat
        )
      }));

      // Buscar na web
      const searchResults = await searchWeb(input).catch(error => {
        console.error('Error in searchWeb:', error);
        return {
          results: [],
          summary: `Error searching for "${input}": ${error.message || 'Unknown error'}`
        };
      });
      
      // Remover mensagem de carregamento
      useChatStore.setState(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                messages: chat.messages.filter(msg => msg.id !== loadingMessageId)
              }
            : chat
        )
      }));

      // Se não temos resultados, mostrar uma mensagem de erro
      if (searchResults.results.length === 0) {
      addMessage(currentChatId, {
        role: 'assistant',
          content: `No results found for "${input}". Try rephrasing your query or visit DuckDuckGo for manual search.`,
        });
        
        setInput('');
        setSearchModeActive(false);
        setIsSearching(false);
        return;
      }

      // Atualizar mensagem de carregamento para mostrar que estamos processando os resultados
      const processingMessageId = Date.now().toString();
      const processingMessage = {
        id: processingMessageId,
        role: 'assistant' as const,
        content: 'Analyzing search results...',
        timestamp: Date.now(),
      };
      
      useChatStore.setState(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                messages: [...chat.messages, processingMessage]
              }
            : chat
        )
      }));

      // Criar um novo AbortController para esta requisição
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Construir o prompt para o modelo com os resultados da pesquisa
      const prompt = `I searched for "${input}" and found these results:

${searchResults.summary}

Based on these search results, please provide a comprehensive answer to my query: "${input}"`;

      // Enviar resultados da pesquisa para o modelo LLM para análise
      const response = await fetch(`/api/ollama?endpoint=${encodeURIComponent(`${ollamaEndpoint}/api/generate`)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          stream: true,
          context_length: useModelStore.getState().selectedContextSize,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze search results: ${response.status}`);
      }

      // Remover a mensagem de processamento
      useChatStore.setState(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChatId 
            ? { 
                ...chat, 
                messages: chat.messages.filter(msg => msg.id !== processingMessageId)
              }
            : chat
        )
      }));

      // Processar a resposta do streaming
      const reader = response.body?.getReader();
      let partialResponse = '';

      if (reader) {
        // Adicionar mensagem inicial do assistente
      addMessage(currentChatId, {
        role: 'assistant',
          content: '',
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              // Tratar cada linha com mais robustez
              let jsonData;
              try {
                jsonData = JSON.parse(line);
              } catch (parseError) {
                console.warn('Invalid JSON:', line);
                // Tentar recuperar a linha
                try {
                  // Tentar limpar e consertar o JSON
                  const cleanedLine = line.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
                  if (cleanedLine.trim()) {
                    jsonData = JSON.parse(cleanedLine);
                  }
                } catch (e) {
                  // Se falhar, ignorar esta linha
                  console.error('Failed to fix JSON line:', line);
                  continue;
                }
              }
              
              // Se temos dados JSON válidos
              if (jsonData && jsonData.response) {
                partialResponse += jsonData.response;
                
                // Update the last assistant message
                const messages = useChatStore.getState().chats.find(c => c.id === currentChatId)?.messages || [];
                const lastMessage = messages[messages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  // Update message with new content
                  useChatStore.setState(state => ({
                    chats: state.chats.map(chat => 
                      chat.id === currentChatId 
                        ? { 
                            ...chat, 
                            messages: chat.messages.map((msg, idx) => 
                              idx === chat.messages.length - 1 
                                ? { ...msg, content: partialResponse }
                                : msg
                            )
                          }
                        : chat
                    )
                  }));
                }
              }
            } catch (e) {
              console.error('Error processing response chunk:', e);
            }
          }
        }
      }

      // Limpar o input e sair do modo de pesquisa
      setInput('');
      setSearchModeActive(false);
    } catch (error: any) {
      console.error('Error searching or analyzing results:', error);
      // Mensagem de erro amigável para o usuário
      addMessage(currentChatId, {
        role: 'assistant',
        content: `Sorry, there was an error: ${error.message || 'Unknown error'}. Please try again later.`,
      });
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  };

  // Botão de pesquisa agora ativa/desativa o modo de pesquisa
  const toggleSearchMode = () => {
    // Só permitir a ativação se não estiver gerando, processando arquivos ou já pesquisando
    if (isGenerating || isProcessingFile || isSearching) return;
    
    // Toggle modo de pesquisa
    setSearchModeActive(!searchModeActive);
    
    // Focar na entrada de texto quando ativar
    if (!searchModeActive) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || attachedFiles.length > 0) && !isGenerating && selectedModel) {
        handleSubmit(e);
      }
    }
  };

  // Close upload menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // New function to handle file upload by type
  const handleUploadOption = (type: 'files' | 'folder' | 'email') => {
    setShowUploadMenu(false);
    setUploadType(type);
    
    if (type === 'email') {
      // Set viewer mode for email files
      setViewerMode(true);
    }
    
    // Show uploader for all types
    setShowUploader(true);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-900">
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="w-full h-full">
          <div className="h-full">
            <div className="space-y-4 p-4 md:px-8 px-3">
              {!currentChat?.messages.length ? (
                <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400">
                  Select a model and start chatting!
                </div>
              ) : (
                currentChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg p-3 sm:p-4 group/message',
                        message.role === 'user'
                          ? 'bg-blue-500 text-white w-[85%] sm:w-[80%] md:w-1/2'
                          : 'bg-gray-700 text-white w-[90%] sm:w-[85%] md:w-[calc(100%-6rem)]'
                      )}
                    >
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700">
        {showUploader && (
          <div className="max-w-3xl mx-auto px-3 sm:px-4">
            <FileUploader 
              onFilesSelected={handleFileUpload} 
              uploadType={uploadType}
            />
          </div>
        )}
        {attachedFiles.length > 0 && (
          <div className="max-w-3xl mx-auto pt-2 px-3 sm:px-4">
            <div className="flex flex-col gap-2">
              {(() => {
                // Verificar se todos os arquivos são de uma única pasta
                const allFilesFromFolder = attachedFiles.every(file => !!(file as any).webkitRelativePath);
                
                if (allFilesFromFolder && attachedFiles.length > 0) {
                  // Obter o nome da pasta
                  const folderPath = (attachedFiles[0] as any).webkitRelativePath || '';
                  const folderName = folderPath.split('/')[0];
                  
                  // Renderizar uma visualização compacta para pasta
                  return (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-blue-400" />
                          <span className="text-sm text-gray-200 font-medium">{folderName}</span>
                          <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs text-white">{attachedFiles.length} files</span>
                        </div>
                        <button
                          onClick={() => {
                            setAttachedFiles([]);
                            setAttachedFilesMetadata([]);
                          }}
                          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                          title="Remove all files"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // Agrupar arquivos por pasta
                  const fileGroups = groupFilesByFolder(attachedFilesMetadata);
                  
                  // Se temos apenas arquivos na raiz, mostrar a visualização normal
                  if (fileGroups.size === 1 && fileGroups.has('root')) {
                    return (
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                          <div key={index} className="bg-gray-700 rounded px-2 sm:px-3 py-1 text-xs sm:text-sm text-white flex items-center gap-1 sm:gap-2">
                            <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                              {(() => {
                                const ext = file.name.split('.').pop()?.toLowerCase();
                                if (ext === 'pdf') {
                                  return (
                                    <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <path d="M14 2v6h6"/>
                                      <path d="M4 13h16"/>
                                    </svg>
                                  );
                                } else if (ext === 'docx' || ext === 'doc') {
                                  return (
                                    <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <path d="M14 2v6h6"/>
                                      <path d="M16 13H8M16 17H8M16 9H8"/>
                                    </svg>
                                  );
                                } else if (ext === 'xlsx' || ext === 'xls') {
                                  return (
                                    <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <path d="M14 2v6h6"/>
                                      <path d="M8 13h8M8 17h8M8 9h2"/>
                                    </svg>
                                  );
                                } else {
                                  return (
                                    <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                      <path d="M13 2v7h7"/>
                                    </svg>
                                  );
                                }
                              })()}
                              {file.name}
                            </span>
                  <button
                              onClick={() => {
                                setAttachedFiles(files => files.filter((_, i) => i !== index));
                                setAttachedFilesMetadata(meta => meta.filter((_, i) => i !== index));
                              }}
                    className="text-gray-400 hover:text-white"
                              title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
                      </div>
                    );
                  } else {
                    // Mostrar visualização agrupada por pasta
                    return (
                      <div className="space-y-2">
                        {Array.from(fileGroups.entries()).map(([folder, files]) => {
                          if (folder === 'root') {
                            // Mostrar arquivos da raiz normalmente
                            return (
                              <div key="root" className="flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                  <div key={index} className="bg-gray-700 rounded px-2 sm:px-3 py-1 text-xs sm:text-sm text-white flex items-center gap-1 sm:gap-2">
                                    <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                                      <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                        <path d="M13 2v7h7"/>
                                      </svg>
                                      {file.name}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const indexInFullList = attachedFilesMetadata.findIndex(f => f.path === file.path);
                                        if (indexInFullList !== -1) {
                                          setAttachedFiles(currentFiles => currentFiles.filter((_, i) => i !== indexInFullList));
                                          setAttachedFilesMetadata(meta => meta.filter((_, i) => i !== indexInFullList));
                                        }
                                      }}
                                      className="text-gray-400 hover:text-white"
                                      title="Remove file"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // Mostrar pasta compacta
                            return (
                              <div key={folder} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-blue-400" />
                                    <span className="text-sm text-gray-200 font-medium">{folder}</span>
                                    <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs text-white">{files.length} files</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      // Remover todos os arquivos desta pasta
                                      const pathsToRemove = new Set(files.map(f => f.path));
                                      setAttachedFiles(currentFiles => 
                                        currentFiles.filter((_, i) => !pathsToRemove.has(attachedFilesMetadata[i].path))
                                      );
                                      setAttachedFilesMetadata(meta => 
                                        meta.filter(f => !pathsToRemove.has(f.path))
                                      );
                                    }}
                                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                                    title="Remove folder"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  }
                }
              })()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Type your message to process the attached files
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto p-3 sm:p-4 relative">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (input.trim() && (searchModeActive || (!isGenerating && selectedModel))) {
                handleSubmit(e)
              }
            }} 
            className="flex flex-col space-y-2"
          >
            <div className={cn(
              "relative flex items-center bg-gray-700 rounded-lg transition-colors",
              searchModeActive && "ring-2 ring-blue-500"
            )}>
              <div className="absolute left-2 flex items-center space-x-2 sm:space-x-3">
                <div className="relative" ref={uploadMenuRef}>
                <button
                  type="button"
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    className={cn(
                      "text-gray-400 hover:text-white p-1 transition-colors",
                      searchModeActive && "opacity-50"
                    )}
                    title="Upload options"
                    disabled={isGenerating || isProcessingFile || isSearching || searchModeActive}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                  
                  {/* Upload options dropdown */}
                  {showUploadMenu && !searchModeActive && (
                    <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-md shadow-lg border border-gray-700 overflow-hidden z-50">
                      <div className="flex flex-col text-sm">
                <button
                  type="button"
                          onClick={() => handleUploadOption('files')}
                          className="flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-gray-300"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" />
                            <path d="M13 2v7h7" />
                          </svg>
                          Upload Files
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUploadOption('folder')}
                          className="flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-gray-300"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          Upload Folder
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUploadOption('email')}
                          className="flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-gray-300"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          Upload PST/OST
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={toggleSearchMode}
                  className={cn(
                    "transition-colors flex items-center justify-center relative group p-1 rounded",
                    searchModeActive 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-400 hover:text-blue-400",
                    (isGenerating || isProcessingFile || isSearching) && "opacity-50 cursor-not-allowed"
                  )}
                  title={searchModeActive ? "Exit search mode" : "Search the web"}
                  disabled={isGenerating || isProcessingFile || isSearching}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(isSearching && "animate-pulse")}
                  >
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="absolute left-full ml-2 py-1 px-2 bg-gray-800 text-xs text-white rounded opacity-0 whitespace-nowrap pointer-events-none group-hover:opacity-100 transition-opacity">
                    {searchModeActive ? "Exit search mode" : "Search mode"}
                  </span>
                </button>
              </div>
              
              <input
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleEnter}
                className="w-full resize-none bg-transparent pl-24 sm:pl-28 pr-12 py-2 text-white min-h-[44px] focus:outline-none"
                placeholder={searchModeActive ? "Search the web..." : "Type your message..."}
                disabled={isGenerating || isProcessingFile || isSearching}
              />
              
              {/* Botão de envio/parar geração */}
              {isGenerating ? (
                <button
                  onClick={handleStopGeneration}
                  type="button"
                  className="absolute right-2 p-1.5 sm:p-2 rounded-lg text-white hover:bg-gray-600 focus:outline-none"
                  title="Stop generation"
                >
                  <div className="relative">
                    {/* Ícone de parada (quadrado) */}
                    <div className="h-4 w-4 bg-white rounded-sm"></div>
                    
                    {/* Círculo de carregamento ao redor */}
                    <div className="absolute inset-[-4px] rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (input.trim() && (searchModeActive || (!isGenerating && selectedModel))) {
                      handleSubmit(e)
                  }
                }}
                type="submit"
                className={cn(
                    'absolute right-2 p-1.5 sm:p-2 rounded-lg text-white',
                  'hover:bg-gray-600 focus:outline-none',
                    ((!input.trim() || (isGenerating && !searchModeActive) || (!selectedModel && !searchModeActive) || isProcessingFile || isSearching)) && 'opacity-50 cursor-not-allowed',
                    searchModeActive && input.trim() && 'bg-blue-500'
                  )}
                  disabled={!input.trim() || (isGenerating && !searchModeActive) || (!selectedModel && !searchModeActive) || isProcessingFile || isSearching}
                >
                  {searchModeActive ? (
                    <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12L20 4L12 20L10 14L4 12Z" fill="currentColor"/>
                </svg>
                  )}
              </button>
              )}
            </div>
            <div className="text-center text-xs text-gray-500">
              {isGenerating 
                ? 'Generating...' 
                : isProcessingFile 
                  ? 'Processing files...' 
                  : isSearching 
                    ? 'Searching the web for information...' 
                    : searchModeActive
                      ? 'Enter your search query and press Enter'
                      : 'AI may produce inaccurate information'}
            </div>
          </form>
        </div>
      </div>
      {showEmailViewer && emailViewerFile && (
        <EmailViewer 
          file={emailViewerFile}
          onClose={() => {
            setShowEmailViewer(false);
            setEmailViewerFile(null);
          }}
        />
      )}
      <ContextMeter 
        inputText={input} 
        attachedFilesSize={attachedFiles.reduce((size, file) => size + Math.ceil(file.size / 4), 0)} 
      />
    </div>
  )
} 
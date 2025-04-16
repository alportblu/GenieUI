'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, Accept } from 'react-dropzone'
import { Upload, Folder, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

// Add custom properties to InputHTMLAttributes
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}

interface FileUploaderProps {
  onFilesSelected: (files: File[], filesList?: {name: string, path: string}[]) => void;
  uploadType?: 'files' | 'folder' | 'email';
}

export function FileUploader({ onFilesSelected, uploadType = 'files' }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [folderName, setFolderName] = useState('');
  const [showFullList, setShowFullList] = useState(false);

  const processFiles = async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    
    if (acceptedFiles.length === 0) {
      toast.error('No files selected');
      setIsProcessing(false);
      return;
    }

    let filesToProcess: File[] = [];
    let filesList: {name: string, path: string}[] = [];
    
    // Process based on the upload type
    if (uploadType === 'folder') {
      // Process only folder files
      const folderFiles = acceptedFiles.filter(file => !!(file as any).webkitRelativePath);
      if (folderFiles.length > 0) {
        // Extrair o nome da pasta a partir do caminho do primeiro arquivo
        const firstPath = (folderFiles[0] as any).webkitRelativePath;
        const folderName = firstPath.split('/')[0];
        setFolderName(folderName);
        
        // Criar a lista de arquivos para passar para o modelo
        filesList = folderFiles.map(file => ({
          name: file.name,
          path: (file as any).webkitRelativePath || file.name
        }));
        
        setFileCount(folderFiles.length);
        toast.success(`Found ${folderFiles.length} files in folder "${folderName}"`);
        filesToProcess = folderFiles;
      } else {
        toast.error('No folder selected or folder is empty');
        setIsProcessing(false);
        return;
      }
    } else if (uploadType === 'email') {
      // Process only PST/OST files
      const emailFiles = acceptedFiles.filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.pst') || fileName.endsWith('.ost');
      });
      
      // Criar a lista de arquivos para passar para o modelo
      filesList = emailFiles.map(file => ({
        name: file.name,
        path: file.name
      }));
      
      if (emailFiles.length > 0) {
        toast.success(`Found ${emailFiles.length} email archive files`);
        filesToProcess = emailFiles;
      } else {
        toast.error('No email archives found. Please select PST or OST files.');
        setIsProcessing(false);
        return;
      }
    } else {
      // Process regular files (non-folder files)
      const regularFiles = acceptedFiles.filter(file => !(file as any).webkitRelativePath);
      filesToProcess = regularFiles;
      
      // Criar a lista de arquivos para passar para o modelo
      filesList = regularFiles.map(file => ({
        name: file.name,
        path: file.name
      }));
    }
    
    if (filesToProcess.length > 0) {
      toast.success(`${filesToProcess.length} files ready to be processed`);
      onFilesSelected(filesToProcess, filesList);
    } else {
      toast.error('No valid files found');
    }
    
    setIsProcessing(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    processFiles(acceptedFiles);
  }, [onFilesSelected, uploadType]);

  // Determine accept types based on upload type
  const getAcceptTypes = (): Accept => {
    if (uploadType === 'email') {
      return {
        'application/vnd.ms-outlook': ['.pst', '.ost'],
      };
    }
    
    // Default accept all supported file types
    return {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/*': ['.txt', '.md', '.csv'],
      'message/rfc822': ['.eml', '.msg'],
      'application/vnd.ms-outlook': ['.pst', '.ost'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    };
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptTypes(),
    noClick: false,
    noKeyboard: false,
    noDrag: false,
    multiple: true,
    // Set directory attribute only for folder upload
    // @ts-ignore - directory is not in type definition but is supported by the library
    directory: uploadType === 'folder',
  });

  // Custom input props for folder upload
  const customInputProps = {
    ...getInputProps(),
    ...(uploadType === 'folder' ? { directory: "true", webkitdirectory: "true" } : {}),
  };

  // Renderizar uma visualização compacta se estamos carregando uma pasta e já temos arquivos
  if (uploadType === 'folder' && fileCount > 0) {
    return (
      <div className="mb-4">
        <div 
          className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center"
          onClick={() => setShowFullList(!showFullList)}
        >
          <div className="flex items-center justify-center gap-2 cursor-pointer">
            <Folder className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-200 font-medium">{folderName}</span>
            <span className="bg-blue-600 rounded-full px-2 py-0.5 text-xs text-white">{fileCount} files</span>
          </div>
          
          {showFullList && (
            <div className="mt-2 text-left max-h-32 overflow-y-auto bg-gray-900 rounded p-2">
              <div className="text-xs text-gray-400">
                Folder contains {fileCount} files. These files will be processed when you send a message.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-sm font-medium text-gray-300 mb-2">
        {uploadType === 'folder' ? 'Upload Folder' : 
         uploadType === 'email' ? 'Upload Email Archive' : 
         'Upload Files'}
      </h2>
      <div
        {...getRootProps()}
        className={`border border-gray-600 rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'bg-gray-700 border-gray-500' : 'hover:bg-gray-700'}`}
      >
        <input {...customInputProps} />
        <div className="flex justify-center items-center gap-2">
          {uploadType === 'folder' ? (
            <Folder className="h-6 w-6 text-gray-400" />
          ) : uploadType === 'email' ? (
            <Mail className="h-6 w-6 text-gray-400" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <p className="mt-2 text-sm text-gray-300">
          {isDragActive
            ? `Drop the ${uploadType === 'folder' ? 'folder' : 
                uploadType === 'email' ? 'email archive' : 'files'} here...`
            : uploadType === 'folder' 
              ? 'Drag & drop a folder here, or click to select' 
              : uploadType === 'email' 
                ? 'Drag & drop PST/OST files here, or click to select'
                : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {uploadType === 'email' 
            ? 'Supports PST/OST email archives' 
            : uploadType === 'folder'
              ? 'Upload an entire folder to include all supported files'
              : 'Supports PDF, Word, Excel, PowerPoint, ZIP, PST/OST, images, and text files'}
        </p>
        {isProcessing && (
          <div className="mt-2">
            <div className="animate-pulse bg-gray-600 h-1 w-full rounded"></div>
            <p className="text-xs text-gray-400 mt-1">Processing files...</p>
          </div>
        )}
      </div>
    </div>
  )
} 
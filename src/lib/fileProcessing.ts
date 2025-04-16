import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import JSZip from 'jszip'
import Tesseract from 'tesseract.js'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
// Importação dinâmica para PDF.js removida

// Configurar o worker para PDF.js (usado internamente por pdf-parse)
if (typeof window !== 'undefined') {
  // Garantir que o objeto global do pdfjsLib exista
  window.pdfjsLib = window.pdfjsLib || {};
  
  // Configurar as opções do worker globalmente
  window.pdfjsLib.GlobalWorkerOptions = window.pdfjsLib.GlobalWorkerOptions || {};
  
  // Definir o workerSrc diretamente no objeto GlobalWorkerOptions
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/1.10.100/pdf.worker.min.js';
  
  // Também tentar configurar o módulo importado por pdf-parse
  try {
    const pdfjsLib = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/1.10.100/pdf.worker.min.js';
    }
  } catch (e) {
    console.warn('Não foi possível configurar diretamente o worker do PDF.js:', e);
  }
}

const SERVER_URL = 'http://localhost:3001';

// Process an entire folder of files
export async function processFolder(files: File[]): Promise<string> {
  if (!files || files.length === 0) return '';
  
  // Group files by folder path
  const filesByFolder: Record<string, File[]> = {};
  
  files.forEach(file => {
    // Handle files with relative path (from folder upload)
    const relativePath = (file as any).webkitRelativePath || '';
    if (relativePath) {
      // Get the folder path (first folder in the path)
      const folderPath = relativePath.split('/')[0];
      if (!filesByFolder[folderPath]) {
        filesByFolder[folderPath] = [];
      }
      filesByFolder[folderPath].push(file);
    }
  });
  
  // Process each folder
  const results: string[] = [];
  
  for (const [folderName, folderFiles] of Object.entries(filesByFolder)) {
    const folderResult = await Promise.all(folderFiles.map(async file => {
      try {
        const content = await processFile(file);
        return `File: ${(file as any).webkitRelativePath}\n${content}`;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return `File: ${(file as any).webkitRelativePath}\nError: Failed to process file`;
      }
    }));
    
    results.push(`== Folder: ${folderName} ==\n\n${folderResult.join('\n\n')}`);
  }
  
  return results.join('\n\n');
}

async function processFileOnServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${SERVER_URL}/process-file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Server processing failed');
  }

  const result = await response.json();
  return result.content;
}

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Iniciando processamento de PDF...');
    
    // Criar um buffer a partir do arrayBuffer
    const buffer = Buffer.from(arrayBuffer);
    
    // Processar o PDF com pdf-parse, usando opções para desativar worker
    const options = {
      // Versão específica do PDF.js a ser usada
      version: 'v1.10.100',
      // Função personalizada para extrair o texto (simplificada)
      pagerender: function(pageData: any) {
        const renderOptions = {
          normalizeWhitespace: false,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(renderOptions)
          .then(function(textContent: any) {
            let text = '';
            let lastY;
            // Extrair o texto item por item, preservando quebras de linha
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
      }
    };
    
    // Processar com opções personalizadas
    const data = await pdfParse(buffer, options);
    
    if (data.text && data.text.trim()) {
      return data.text.trim();
    } else {
      console.warn('PDF processado, mas sem texto extraído');
      return 'Não foi encontrado texto neste PDF. O PDF pode conter apenas imagens ou ser digitalizado.';
    }
  } catch (error: any) {
    console.error('Erro geral no processamento de PDF:', error);
    
    // Fornecer uma resposta amigável
    const errorInfo = `[PDF processado: ${Math.round(arrayBuffer.byteLength / 1024)}KB]`;
    const errorMessage = error?.message || 'Erro desconhecido';
    return `${errorInfo}\nNão foi possível extrair texto do PDF: ${errorMessage}`;
  }
}

async function extractTextFromWord(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || 'No text content found in Word document';
  } catch (error) {
    console.error('Error processing Word document:', error);
    return 'Error: Could not process Word document';
  }
}

async function extractTextFromExcel(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    let result = '';

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      result += `[Sheet: ${sheetName}]\n`;
      for (const row of sheetData as any[][]) {
        if (row.length > 0) {
          result += row.join('\t') + '\n';
        }
      }
      result += '\n';
    }

    return result || 'No data found in Excel file';
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return 'Error: Could not process Excel file';
  }
}

async function extractTextFromZip(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Handle empty files
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return 'Error: Empty ZIP file.';
    }
    
    // First, validate the ZIP format
    const view = new Uint8Array(arrayBuffer);
    // Check for ZIP signature (PK..)
    if (view.length < 4 || view[0] !== 0x50 || view[1] !== 0x4B) {
      return 'Error: Not a valid ZIP file format.';
    }
    
    try {
      const zip = await JSZip.loadAsync(arrayBuffer, { 
        checkCRC32: false, // Less strict validation
      });
      
      let content = '';
      let fileCount = 0;
      let processedCount = 0;

      const processFile = async (relativePath: string, file: JSZip.JSZipObject) => {
        try {
          if (file.dir) return '';
          
          // Try to extract as string first
          try {
            const data = await file.async('string');
            return `[File: ${relativePath}]\n${data.slice(0, 2000)}${data.length > 2000 ? '...(truncated)' : ''}\n\n`;
          } catch (strError) {
            console.error(`Error extracting string from ${relativePath}:`, strError);
            
            // Fall back to binary extraction
            try {
              const binary = await file.async('uint8array');
              return `[File: ${relativePath}]\n[Binary file, size: ${binary.length} bytes]\n\n`;
            } catch {
              return `[File: ${relativePath}]\n[Error: Could not extract content]\n\n`;
            }
          }
        } catch (error) {
          console.error(`Error extracting ${relativePath}:`, error);
          return `[File: ${relativePath}]\n[Error extracting content]\n\n`;
        }
      };

      // Get total files count
      zip.forEach(() => { fileCount++; });
      
      // Process files in smaller batches to avoid memory issues
      const batchSize = 5;
      const files: Array<{path: string, file: JSZip.JSZipObject}> = [];
      
      zip.forEach((path, file) => {
        files.push({path, file});
      });
      
      // Process in batches
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(({path, file}) => processFile(path, file))
        );
        
        content += results.join('');
        processedCount += batch.length;
      }
      
      if (fileCount === 0) {
        return 'ZIP file contains no files.';
      }
      
      return content || `ZIP file contains ${fileCount} files but no text content could be extracted.`;
    } catch (zipError: any) {
      console.error('ZIP processing error:', zipError);
      return `Error: Could not process ZIP file. The file may be corrupted. ${zipError.message || ''}`;
    }
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    return 'Error: Could not process ZIP file. The file format may be invalid or corrupted.';
  }
}

async function extractTextFromImage(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const blob = new Blob([arrayBuffer]);
    
    // Log progress para debug
    console.log('Starting OCR processing...');
    
    try {
      // Inicializar worker com configurações mais estáveis
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: percent => {
          if (percent.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(percent.progress * 100)}%`);
          }
        }
      });
      
      // Configurar worker para melhor precisão
      await worker.setParameters({
        tessedit_ocr_engine_mode: 1, // 1 = Neural nets LSTM only
        preserve_interword_spaces: '1',
      });
      
      console.log('OCR worker initialized, starting recognition...');
      
      // Processar a imagem
      const result = await worker.recognize(blob);
      console.log('OCR processing completed successfully');
      
      // Limpar recursos
      await worker.terminate();
      
      if (result.data && result.data.text) {
        const extractedText = result.data.text.trim();
        return extractedText || 'No text detected in image';
      } else {
        return 'No text detected in image';
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      
      // Tentar método alternativo para imagens
      try {
        console.log('Attempting fallback image processing...');
        // Para imagens, podemos pelo menos descrever o que temos
        const imageInfo = `[Image file processed: ${Math.round(arrayBuffer.byteLength / 1024)}KB in size]`;
        return `${imageInfo}\nOCR Error: Could not extract text from image. The image might be too complex or low quality for text recognition.`;
      } catch (fallbackError) {
        console.error('Fallback processing failed:', fallbackError);
        return 'Error: Could not process image content';
      }
    }
  } catch (error) {
    console.error('Error in image processing:', error);
    return `Error: Could not process image. Details: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function extractTextFromText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  } catch (error) {
    console.error('Error processing text file:', error);
    return 'Error: Could not process text file';
  }
}

async function extractTextFromMarkdown(text: string): Promise<string> {
  try {
    const processor = unified().use(remarkParse).use(remarkStringify);
    const parsed = await processor.parse(text);
    return processor.stringify(parsed);
  } catch (error) {
    console.error('Error processing Markdown:', error);
    return text; // Return the raw text if processing fails
  }
}

// Export a function to process PST/OST files for search queries
export async function extractEmailContent(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`Extracting content from email file: ${file.name} (${Math.round(file.size / 1024)}KB)`);
    
    const response = await fetch(`${SERVER_URL}/extract-email-content`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server processing failed with status ${response.status}`);
    }

    // Get response text first
    const responseText = await response.text();
    
    try {
      // Try to parse as JSON
      const result = JSON.parse(responseText);
      console.log('Email content extracted successfully');
      return result.content || 'No email content found';
    } catch (jsonError) {
      console.error('JSON parse error in email extraction:', jsonError);
      console.log('Raw response:', responseText.substring(0, 200) + '...');
      
      // Try to salvage content if possible
      if (responseText.includes('"content":')) {
        try {
          const contentMatch = responseText.match(/"content":"([^"]+)"/);
          if (contentMatch && contentMatch[1]) {
            return contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') || 'No email content found';
          }
        } catch (e) {
          console.error('Failed to extract content from malformed JSON', e);
        }
      }
      
      return 'Error parsing email content: Invalid response format';
    }
  } catch (error: any) {
    console.error('Error extracting email content:', error);
    return `Error processing email file: ${error.message || 'Unknown error'}`;
  }
}

export async function processFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Check file type and use appropriate extraction method
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return extractTextFromPDF(arrayBuffer);
    } else if (
      fileType.includes('word') || 
      fileType.includes('docx') || 
      fileType.includes('doc') || 
      fileName.endsWith('.docx') || 
      fileName.endsWith('.doc')
    ) {
      return extractTextFromWord(arrayBuffer);
    } else if (
      fileType.includes('excel') || 
      fileType.includes('xlsx') || 
      fileType.includes('xls') || 
      fileName.endsWith('.xlsx') || 
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv')
    ) {
      return extractTextFromExcel(arrayBuffer);
    } else if (
      fileType.includes('zip') || 
      fileName.endsWith('.zip')
    ) {
      return extractTextFromZip(arrayBuffer);
    } else if (
      fileType.includes('image') || 
      fileName.endsWith('.png') || 
      fileName.endsWith('.jpg') || 
      fileName.endsWith('.jpeg') || 
      fileName.endsWith('.gif')
    ) {
      return extractTextFromImage(arrayBuffer);
    } else if (
      fileType.includes('text') || 
      fileName.endsWith('.txt') ||
      fileName.endsWith('.csv')
    ) {
      return extractTextFromText(arrayBuffer);
    } else if (fileName.endsWith('.md')) {
      const text = await extractTextFromText(arrayBuffer);
      return extractTextFromMarkdown(text);
    } else if (
      fileType.includes('ppt') || 
      fileName.endsWith('.ppt') || 
      fileName.endsWith('.pptx')
    ) {
      // For PowerPoint, we'll need to use a server-side approach
      return processFileOnServer(file);
    } else if (
      fileType.includes('outlook') || 
      fileName.endsWith('.pst') || 
      fileName.endsWith('.ost')
    ) {
      // Extract email content for the model to process
      return extractEmailContent(file);
    } else if (
      fileName.endsWith('.eml') ||
      fileName.endsWith('.msg')
    ) {
      // Individual email files
      return processFileOnServer(file);
    } else {
      // Try to process as text for unknown types
      try {
        return extractTextFromText(arrayBuffer);
      } catch (e) {
        return `Unsupported file type: ${fileType || fileName}`;
      }
    }
  } catch (error: any) {
    console.error('Error processing file:', error);
    return `Error processing file: ${error.message || 'Unknown error'}`;
  }
} 
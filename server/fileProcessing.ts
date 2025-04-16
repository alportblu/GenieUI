import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as pptxgen from 'pptxgenjs';

const readFile = promisify(fs.readFile);

interface UploadedFile {
  path: string;
  originalname: string;
  mimetype: string;
}

async function processPowerPoint(filePath: string): Promise<string> {
  try {
    // PowerPoint processing logic here
    // This is a placeholder - we'll need a more robust PowerPoint processing library
    const fileContent = await readFile(filePath);
    return `PowerPoint content processed. Size: ${fileContent.length} bytes`;
  } catch (error) {
    console.error('Error processing PowerPoint:', error);
    return 'Error processing PowerPoint file';
  }
}

async function processOutlookFile(filePath: string): Promise<string> {
  try {
    // PST/OST processing logic here
    // This is a placeholder - we'll need a proper PST/OST processing library
    const fileContent = await readFile(filePath);
    return `Outlook file processed. Size: ${fileContent.length} bytes`;
  } catch (error) {
    console.error('Error processing Outlook file:', error);
    return 'Error processing Outlook file';
  }
}

export async function processServerFile(file: UploadedFile): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  
  try {
    switch (extension) {
      case 'ppt':
      case 'pptx':
        return await processPowerPoint(file.path);
      
      case 'pst':
      case 'ost':
        return await processOutlookFile(file.path);
      
      default:
        return `Unsupported file type on server: ${extension}`;
    }
  } finally {
    // Limpar o arquivo temporário após o processamento
    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }
  }
} 
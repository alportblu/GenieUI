import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as pptxgen from 'pptxgenjs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const readFileAsync = promisify(fs.readFile);
const readFile = fs.promises.readFile;

interface UploadedFile {
  path: string;
  originalname: string;
  mimetype: string;
}

async function processPowerPoint(filePath: string): Promise<string> {
  try {
    const stats = await fs.promises.stat(filePath);
    return `[PowerPoint File: ${path.basename(filePath)} - Size: ${stats.size} bytes]`;
  } catch (error) {
    console.error('Error processing PowerPoint:', error);
    return `Error processing PowerPoint file: ${path.basename(filePath)}`;
  }
}

async function processOutlookFile(filePath: string): Promise<string> {
  try {
    const stats = await fs.promises.stat(filePath);
    return `[Outlook Data File: ${path.basename(filePath)} - Size: ${stats.size} bytes]`;
  } catch (error) {
    console.error('Error processing Outlook file:', error);
    return `Error processing Outlook file: ${path.basename(filePath)}`;
  }
}

async function processWordFile(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error processing Word file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing Word file ${path.basename(filePath)}: ${message}`;
  }
}

async function processPdf(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || `[PDF File: ${path.basename(filePath)} - No text found]`;
  } catch (error) {
    console.error('Error processing PDF file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing PDF file ${path.basename(filePath)}: ${message}`;
  }
}

async function processExcel(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const workbook = XLSX.read(dataBuffer, { type: 'buffer' });
    let content = '';
    workbook.SheetNames.forEach(sheetName => {
      content += `--- Sheet: ${sheetName} ---\n`;
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(worksheet);
      content += sheetData + '\n\n';
    });
    return content.trim();
  } catch (error) {
    console.error('Error processing Excel file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing Excel file ${path.basename(filePath)}: ${message}`;
  }
}

async function processZip(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);
    let content = `--- ZIP File Contents: ${path.basename(filePath)} ---\n`;
    const fileList: string[] = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        fileList.push(relativePath);
      }
    });
    content += fileList.slice(0, 50).join('\n');
    if (fileList.length > 50) {
      content += '\n... (and more files)';
    }
    return content;
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing ZIP file ${path.basename(filePath)}: ${message}`;
  }
}

async function processText(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, { encoding: 'utf-8' });
    return content;
  } catch (error) {
    console.error('Error processing Text file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing Text file ${path.basename(filePath)}: ${message}`;
  }
}

async function processImagePlaceholder(filePath: string): Promise<string> {
  try {
    const stats = await fs.promises.stat(filePath);
    return `[Image File: ${path.basename(filePath)} - Size: ${stats.size} bytes]`;
  } catch (error) {
    console.error('Error processing Image file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Error processing Image file ${path.basename(filePath)}: ${message}`;
  }
}

export async function processServerFile(file: UploadedFile): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  const filePath = file.path;

  console.log(`Processing file on server: ${file.originalname} (type: ${extension})`);

  try {
    switch (extension) {
      case 'ppt':
      case 'pptx':
        return await processPowerPoint(filePath);
      case 'pst':
      case 'ost':
        return await processOutlookFile(filePath);
      case 'docx':
        return await processWordFile(filePath);
      case 'doc':
        console.warn(`.doc file detected (${file.originalname}), attempting processing with mammoth.`);
        return await processWordFile(filePath);
      case 'pdf':
        return await processPdf(filePath);
      case 'xlsx':
      case 'xls':
      case 'csv':
        return await processExcel(filePath);
      case 'zip':
        return await processZip(filePath);
      case 'txt':
      case 'md':
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'c':
      case 'cpp':
        return await processText(filePath);
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
        return await processImagePlaceholder(filePath);
      default:
        console.warn(`Unsupported extension '${extension}', attempting to read as text: ${file.originalname}`);
        try {
          return await processText(filePath);
        } catch (textError) {
          console.error(`Failed to read unsupported file ${file.originalname} as text.`, textError);
          return `[Unsupported File Type: ${extension} - ${path.basename(filePath)}]`;
        }
    }
  } catch (error) {
    console.error(`Unhandled error processing ${file.originalname}:`, error);
    return `Error: An unexpected error occurred while processing the file ${path.basename(filePath)}.`;
  } finally {
    try {
      await fs.promises.unlink(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting temporary file ${filePath}:`, error);
    }
  }
} 
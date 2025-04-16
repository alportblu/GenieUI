import express from 'express';
import multer from 'multer';
import cors from 'cors';
import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PSTFile, PSTFolder, PSTMessage } from 'pst-extractor';
import { v4 as uuidv4 } from 'uuid';
import { processServerFile } from './fileProcessing';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Endpoint para processar arquivos
app.post('/process-file', upload.single('file'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const result = await processServerFile(req.file);
    res.json({ content: result });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// New endpoint for processing PST/OST email files
app.post('/process-email-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    
    // Check if file is PST/OST
    if (!file.originalname.toLowerCase().endsWith('.pst') && 
        !file.originalname.toLowerCase().endsWith('.ost')) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only PST/OST files are supported' });
    }
    
    try {
      const pstFile = new PSTFile(file.path);
      const rootFolder = pstFile.getRootFolder();
      
      const emails: any[] = [];
      const folderStructure: any[] = [];
      
      // Process folder structure and emails
      processPSTFolder(rootFolder, '', folderStructure, emails);
      
      // Clean up temp file after processing
      fs.unlinkSync(file.path);
      
      return res.json({ 
        folders: folderStructure,
        emails: emails,
        totalEmails: emails.length
      });
    } catch (pstError) {
      console.error('Error processing PST file:', pstError);
      // Clean up temp file
      fs.unlinkSync(file.path);
      return res.status(500).json({ error: 'Error processing PST/OST file: ' + pstError.message });
    }
  } catch (error) {
    console.error('Error in request:', error);
    return res.status(500).json({ error: 'Server error processing email file' });
  }
});

// New endpoint to extract all email content for AI processing
app.post('/extract-email-content', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    
    // Check if file is PST/OST
    if (!file.originalname.toLowerCase().endsWith('.pst') && 
        !file.originalname.toLowerCase().endsWith('.ost')) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only PST/OST files are supported' });
    }
    
    try {
      const pstFile = new PSTFile(file.path);
      const rootFolder = pstFile.getRootFolder();
      
      const emails: any[] = [];
      const folders: any[] = [];
      
      // Extract all emails for AI processing
      extractAllEmails(rootFolder, '', folders, emails);
      
      // Create a structured text representation for the model
      let content = `Email Archive: ${file.originalname}\n`;
      content += `Total emails: ${emails.length}\n`;
      content += `Folders: ${folders.map(f => f.name).join(', ')}\n\n`;
      
      // Format emails for text processing
      content += emails.map(email => {
        return [
          `--- Email ${email.id} ---`,
          `Folder: ${email.folderPath}`,
          `Date: ${email.date}`,
          `From: ${email.from}`,
          `To: ${email.to}`,
          `Subject: ${email.subject}`,
          `Content:`,
          email.body,
          email.hasAttachments ? `Attachments: ${email.attachments.map((a: any) => a.filename).join(', ')}` : '',
          '-------------------'
        ].join('\n');
      }).join('\n\n');
      
      // Clean up temp file after processing
      fs.unlinkSync(file.path);
      
      return res.json({ 
        content: content
      });
    } catch (pstError) {
      console.error('Error processing PST file:', pstError);
      // Clean up temp file
      fs.unlinkSync(file.path);
      return res.status(500).json({ error: 'Error processing PST/OST file: ' + pstError.message });
    }
  } catch (error) {
    console.error('Error in request:', error);
    return res.status(500).json({ error: 'Server error processing email file' });
  }
});

// Function to recursively process PST folders
function processPSTFolder(folder: PSTFolder, parentPath: string, folderStructure: any[], emails: any[]) {
  const folderName = folder.getDisplayName() || 'Unnamed Folder';
  const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName;
  
  // Count emails in this folder
  let emailCount = 0;
  let contentCount = folder.getContentCount();
  
  // Add folder to structure
  const folderData = {
    name: folderName,
    path: currentPath,
    emailCount: 0, // Will update after processing
    subfolders: []
  };
  
  // Process emails in this folder
  if (contentCount > 0) {
    try {
      // Get emails
      let email = folder.getNextChild();
      while (email !== null) {
        if (email instanceof PSTMessage) {
          emailCount++;
          
          // Extract email data
          const attachments = [];
          const attachmentCount = email.getNumberOfAttachments();
          
          if (attachmentCount > 0) {
            for (let i = 0; i < attachmentCount; i++) {
              try {
                const attachment = email.getAttachment(i);
                if (attachment) {
                  attachments.push({
                    filename: attachment.getFilename() || `attachment-${i}`,
                    contentType: attachment.getMimeTag() || 'application/octet-stream',
                    size: attachment.getSize() || 0
                  });
                }
              } catch (attError) {
                console.error('Error processing attachment:', attError);
              }
            }
          }
          
          emails.push({
            id: uuidv4(),
            subject: email.getSubject() || '',
            from: email.getSenderName() || email.getSenderEmailAddress() || 'Unknown',
            to: email.getRecipients() || email.getDisplayTo() || '',
            cc: email.getDisplayCC() || '',
            date: email.getMessageDeliveryTime()?.toISOString() || new Date().toISOString(),
            body: email.getBody() || '',
            hasAttachments: attachmentCount > 0,
            attachments: attachments,
            folderPath: currentPath
          });
        }
        
        email = folder.getNextChild();
      }
    } catch (e) {
      console.error('Error processing emails in folder:', e);
    }
  }
  
  // Update email count
  folderData.emailCount = emailCount;
  
  // Process subfolders
  if (folder.hasSubfolders()) {
    let childFolder = folder.getSubFolder();
    while (childFolder !== null) {
      processPSTFolder(childFolder, currentPath, folderData.subfolders, emails);
      childFolder = folder.getNextSubFolder();
    }
  }
  
  // Only add to structure if it has emails or subfolders with emails
  if (emailCount > 0 || folderData.subfolders.length > 0) {
    folderStructure.push(folderData);
  }
}

// Function to extract all emails recursively
function extractAllEmails(folder: PSTFolder, parentPath: string, folders: any[], emails: any[]) {
  const folderName = folder.displayName || 'Unnamed Folder';
  const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName;
  
  // Add folder to structure
  const folderData = {
    name: folderName,
    path: currentPath,
    emailCount: 0
  };
  
  // Process emails in this folder
  if (folder.contentCount > 0) {
    try {
      // Get emails
      let email = folder.getNextChild();
      while (email !== null) {
        if (email instanceof PSTMessage) {
          folderData.emailCount++;
          
          // Extract email data
          const attachments = [];
          const attachmentCount = email.numberOfAttachments;
          
          if (attachmentCount > 0) {
            for (let i = 0; i < attachmentCount; i++) {
              try {
                const attachment = email.getAttachment(i);
                if (attachment) {
                  attachments.push({
                    filename: attachment.filename || `attachment-${i}`,
                    contentType: attachment.mimeTag || 'application/octet-stream',
                    size: attachment.size || 0
                  });
                }
              } catch (attError) {
                console.error('Error processing attachment:', attError);
              }
            }
          }
          
          emails.push({
            id: uuidv4(),
            subject: email.subject || '',
            from: email.senderName || email.senderEmailAddress || 'Unknown',
            to: email.recipients || email.displayTo || '',
            cc: email.displayCC || '',
            date: email.messageDeliveryTime?.toISOString() || new Date().toISOString(),
            body: email.body || '',
            hasAttachments: attachmentCount > 0,
            attachments: attachments,
            folderPath: currentPath
          });
        }
        
        email = folder.getNextChild();
      }
    } catch (e) {
      console.error('Error processing emails in folder:', e);
    }
  }
  
  // Only add folders with emails
  if (folderData.emailCount > 0) {
    folders.push(folderData);
  }
  
  // Process subfolders
  if (folder.hasSubfolders) {
    let childFolder = folder.getSubFolder();
    while (childFolder !== null) {
      extractAllEmails(childFolder, currentPath, folders, emails);
      childFolder = folder.getNextSubFolder();
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
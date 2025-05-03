import express, { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import cors from 'cors';
import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processServerFile } from './fileProcessing';

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
const processFile: RequestHandler = async (req, res) => {
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
};

app.post('/process-file', upload.single('file'), processFile);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
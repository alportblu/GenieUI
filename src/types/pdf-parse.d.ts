declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    IsCollectionPresent?: boolean;
    IsSignaturesPresent?: boolean;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Metadata?: any;
    [key: string]: any;
  }

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: any;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: PDFOptions): Promise<PDFData>;
  
  export default pdfParse;
} 
'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, ChevronDown, ChevronRight, Paperclip, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
}

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  date: string;
  body: string;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  folderPath: string;
}

interface EmailFolder {
  name: string;
  path: string;
  emailCount: number;
  subfolders: EmailFolder[];
}

interface EmailViewerProps {
  file: File;
  onClose: () => void;
}

export function EmailViewer({ file, onClose }: EmailViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderStructure, setFolderStructure] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    const processEmailFile = async () => {
      try {
        setLoading(true);
        
        // Upload file to server for processing
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:3001/process-email-file', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setFolderStructure(data.folders || []);
        setEmails(data.emails || []);
        setFilteredEmails(data.emails || []);
        
        if (data.emails && data.emails.length > 0) {
          setSelectedFolder(data.emails[0].folderPath);
        }
      } catch (err: any) {
        console.error('Error processing email file:', err);
        setError(err.message || 'Failed to process email file');
      } finally {
        setLoading(false);
      }
    };
    
    if (file) {
      processEmailFile();
    }
  }, [file]);
  
  useEffect(() => {
    let results = emails;
    
    // Filter by selected folder
    if (selectedFolder) {
      results = results.filter(email => email.folderPath.startsWith(selectedFolder));
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(email => 
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.to.toLowerCase().includes(query) ||
        email.body.toLowerCase().includes(query)
      );
    }
    
    setFilteredEmails(results);
  }, [searchQuery, emails, selectedFolder]);
  
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };
  
  const selectFolder = (path: string) => {
    setSelectedFolder(path);
  };
  
  const renderFolderTree = (folders: EmailFolder[], basePath = '') => {
    return (
      <ul className="pl-4">
        {folders.map(folder => {
          const fullPath = basePath ? `${basePath}/${folder.name}` : folder.name;
          const isExpanded = expandedFolders.has(fullPath);
          const isSelected = selectedFolder === fullPath;
          
          return (
            <li key={fullPath} className="my-1">
              <div className={`flex items-center ${isSelected ? 'bg-blue-900/20 rounded' : ''}`}>
                {folder.subfolders.length > 0 ? (
                  <button 
                    onClick={() => toggleFolder(fullPath)} 
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <span className="w-6" />
                )}
                
                <button 
                  className={`flex-1 text-left p-1 rounded hover:bg-gray-700 ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}
                  onClick={() => selectFolder(fullPath)}
                >
                  <Mail size={14} className="inline mr-2" />
                  {folder.name} 
                  <span className="text-xs text-gray-500 ml-1">
                    ({folder.emailCount})
                  </span>
                </button>
              </div>
              
              {isExpanded && folder.subfolders.length > 0 && (
                renderFolderTree(folder.subfolders, fullPath)
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Processing Email Archive</h2>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-gray-400 mt-4">This may take a while for large files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-xl w-full">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            {file.name} ({filteredEmails.length} emails)
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search emails by subject, sender, or content..."
              className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-1 min-h-0">
          {/* Folder Tree */}
          <div className="w-1/4 border-r border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Folders</h3>
            {renderFolderTree(folderStructure)}
          </div>
          
          {/* Email List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                No emails found
              </div>
            ) : (
              <ul>
                {filteredEmails.map(email => (
                  <li 
                    key={email.id}
                    className={`border-b border-gray-700 hover:bg-gray-700 cursor-pointer
                      ${selectedEmail?.id === email.id ? 'bg-gray-700' : ''}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-white">{email.from.split('<')[0].trim()}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(email.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white mb-1 truncate">
                        {email.subject || '(No Subject)'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {email.body.substring(0, 100)}...
                      </div>
                      {email.hasAttachments && (
                        <div className="text-xs text-blue-400 mt-1">
                          <Paperclip size={12} className="inline mr-1" /> Has attachments
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Email Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedEmail ? (
              <div>
                <h3 className="text-xl font-medium text-white mb-4">{selectedEmail.subject || '(No Subject)'}</h3>
                
                <div className="bg-gray-750 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <div className="text-white">
                      <span className="font-medium">From:</span> {selectedEmail.from}
                    </div>
                    <div className="text-gray-400 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(selectedEmail.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-white mb-2">
                    <span className="font-medium">To:</span> {selectedEmail.to}
                  </div>
                  {selectedEmail.cc && (
                    <div className="text-white mb-2">
                      <span className="font-medium">CC:</span> {selectedEmail.cc}
                    </div>
                  )}
                  {selectedEmail.hasAttachments && selectedEmail.attachments && (
                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <div className="font-medium text-white mb-1">Attachments:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att, idx) => (
                          <div 
                            key={idx} 
                            className="bg-gray-700 text-sm rounded px-3 py-1 flex items-center"
                          >
                            <Paperclip size={14} className="mr-1 text-blue-400" />
                            <span className="text-white">{att.filename}</span>
                            <span className="text-gray-400 text-xs ml-2">
                              ({Math.round(att.size / 1024)}KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-750 rounded-lg p-4 whitespace-pre-line text-white">
                  {selectedEmail.body.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select an email to view its contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
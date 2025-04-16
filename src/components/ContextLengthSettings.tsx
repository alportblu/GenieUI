'use client';

import React, { useState, useEffect } from 'react';
import { useModelStore, ModelInfo } from '@/store/modelStore';

interface ContextLengthSettingsProps {
  modelName: string;
}

export function ContextLengthSettings({ modelName }: ContextLengthSettingsProps) {
  const { modelsInfo, setModelInfo, getContextLength } = useModelStore();
  const [customContextLength, setCustomContextLength] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Get model info from store
  const modelInfo = modelsInfo[modelName];
  
  // Initialize with current context length
  useEffect(() => {
    if (modelInfo?.contextLength) {
      setCustomContextLength(modelInfo.contextLength);
    }
  }, [modelName, modelInfo]);
  
  // Handle saving the custom context length
  const handleSave = () => {
    if (customContextLength && modelInfo) {
      const updatedInfo: ModelInfo = {
        ...modelInfo,
        contextLength: customContextLength
      };
      setModelInfo(modelName, updatedInfo);
    }
    setIsEditing(false);
  };
  
  // Handle context length input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomContextLength(value);
    }
  };
  
  if (!modelInfo) {
    return null;
  }
  
  return (
    <div className="mt-4 bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Context Length Settings</h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-blue-400 text-xs hover:text-blue-300"
        >
          {showInfo ? 'Hide Info' : 'About Context'}
        </button>
      </div>
      
      {showInfo && (
        <div className="mt-2 text-xs text-gray-400 bg-gray-900 rounded p-2">
          <p>Context length refers to the maximum number of tokens a model can process at once.</p>
          <p className="mt-1">Larger context allows processing bigger files but may slow down responses.</p>
          <p className="mt-1">Some models support longer contexts than their default settings.</p>
        </div>
      )}
      
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Current context: {getContextLength(modelName).toLocaleString()} tokens</span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              Adjust
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCustomContextLength(modelInfo.contextLength || 4096);
                }}
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="mt-2">
            <input
              type="number"
              min="1024"
              max="128000"
              step="1024"
              value={customContextLength || 4096}
              onChange={handleInputChange}
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Min: 1024</span>
              <span>Max: 128K</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              <p>Common values by model size:</p>
              <ul className="ml-4 list-disc">
                <li>Small models (7B): 4K-8K tokens</li>
                <li>Medium models (13B): 8K-16K tokens</li>
                <li>Large models (70B+): 16K-32K tokens</li>
              </ul>
              <p className="mt-1 text-yellow-500">Note: Setting values beyond what your model or hardware supports may cause errors or crashes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
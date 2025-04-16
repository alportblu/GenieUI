'use client'

import React from 'react'
import { useModelStore } from '@/store/modelStore'

export function Settings() {
  const { apiKeys, setApiKey } = useModelStore()

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-primary">API Keys</h2>
        
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">OpenAI API Key</span>
            </label>
            <input
              type="password"
              value={apiKeys.openai || ''}
              placeholder="sk-..."
              className="input input-bordered"
              onChange={(e) => setApiKey('openai', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Anthropic API Key</span>
            </label>
            <input
              type="password"
              value={apiKeys.anthropic || ''}
              placeholder="sk-ant-..."
              className="input input-bordered"
              onChange={(e) => setApiKey('anthropic', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Google API Key</span>
            </label>
            <input
              type="password"
              value={apiKeys.google || ''}
              placeholder="AIza..."
              className="input input-bordered"
              onChange={(e) => setApiKey('google', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
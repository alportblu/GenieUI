'use client'

import React from 'react'
import { Settings } from '@/components/Settings'
import { ModelSelector } from '@/components/ModelSelector'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center mb-8">
          <Link href="/" className="btn btn-ghost btn-circle mr-4">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
        </div>
        
        <div className="space-y-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Model Configuration</h2>
            <ModelSelector />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">API Keys</h2>
            <Settings />
          </div>
        </div>
      </div>
    </main>
  )
} 
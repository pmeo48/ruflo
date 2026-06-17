'use client'

import { FileText, Table2, Layout, MessageSquare } from 'lucide-react'
import { ProductType } from '@/lib/types'

const TYPES = [
  { id: 'pdf' as ProductType, label: 'PDF Guide', icon: FileText, color: 'bg-blue-100 text-blue-700', desc: 'Ebooks, guides, how-to PDFs' },
  { id: 'spreadsheet' as ProductType, label: 'Spreadsheet', icon: Table2, color: 'bg-green-100 text-green-700', desc: 'Excel & Google Sheets' },
  { id: 'notion' as ProductType, label: 'Notion Template', icon: Layout, color: 'bg-purple-100 text-purple-700', desc: 'Complete workspaces' },
  { id: 'prompt-pack' as ProductType, label: 'Prompt Pack', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-700', desc: 'AI prompt collections' },
]

interface ProductTypeSelectorProps {
  value: ProductType | ''
  onChange: (type: ProductType) => void
}

export function ProductTypeSelector({ value, onChange }: ProductTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TYPES.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${value === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${type.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-medium text-sm text-gray-900">{type.label}</div>
            <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

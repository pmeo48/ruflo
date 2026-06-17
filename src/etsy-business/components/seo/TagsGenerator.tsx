'use client'

import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'

interface TagsGeneratorProps {
  tags: string[]
  onTagsChange?: (tags: string[]) => void
  maxTags?: number
}

export function TagsGenerator({ tags, onTagsChange, maxTags = 13 }: TagsGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    navigator.clipboard.writeText(tags.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const removeTag = (index: number) => {
    onTagsChange?.(tags.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">
          Tags <span className={`${tags.length >= maxTags ? 'text-green-600' : 'text-gray-400'}`}>({tags.length}/{maxTags})</span>
        </div>
        <button onClick={copyAll} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
          {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy all</>}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <div key={i} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-700">
            {tag}
            {onTagsChange && (
              <button onClick={() => removeTag(i)} className="text-indigo-300 hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {tags.length < maxTags && (
          <div className="px-2.5 py-1 border border-dashed border-gray-300 rounded-full text-xs text-gray-400">
            {maxTags - tags.length} more available
          </div>
        )}
      </div>
    </div>
  )
}

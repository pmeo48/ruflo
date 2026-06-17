'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Keyword } from '@/lib/types'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface KeywordTableProps {
  keywords: Keyword[]
  onSelect?: (keyword: Keyword) => void
}

export function KeywordTable({ keywords, onSelect }: KeywordTableProps) {
  const [sortBy, setSortBy] = useState<'searchVolume' | 'relevanceScore'>('searchVolume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...keywords].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1
    return (a[sortBy] - b[sortBy]) * dir
  })

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc') }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left py-2 text-xs font-medium text-gray-500">Keyword</th>
          <th className="text-right py-2 text-xs font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('searchVolume')}>
            <div className="flex items-center justify-end gap-1">
              Volume {sortBy === 'searchVolume' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
            </div>
          </th>
          <th className="text-center py-2 text-xs font-medium text-gray-500">Competition</th>
          <th className="text-right py-2 text-xs font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('relevanceScore')}>
            <div className="flex items-center justify-end gap-1">
              Relevance {sortBy === 'relevanceScore' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
            </div>
          </th>
          <th className="text-center py-2 text-xs font-medium text-gray-500">Trend</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((kw) => (
          <tr key={kw.term} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => onSelect?.(kw)}>
            <td className="py-2 font-medium text-gray-800">{kw.term}</td>
            <td className="py-2 text-right text-gray-600">{kw.searchVolume.toLocaleString()}</td>
            <td className="py-2 text-center">
              <Badge variant={kw.competition === 'low' ? 'green' : kw.competition === 'medium' ? 'yellow' : 'red'}>{kw.competition}</Badge>
            </td>
            <td className="py-2 text-right font-medium text-gray-900">{kw.relevanceScore}%</td>
            <td className="py-2 text-center">
              <span className={kw.trend === 'up' ? 'text-green-500' : kw.trend === 'down' ? 'text-red-500' : 'text-gray-400'}>
                {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

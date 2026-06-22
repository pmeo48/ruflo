'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Rocket, Plus, ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2, ExternalLink, X } from 'lucide-react'
import {
  LAUNCH_PHASES, loadChecklists, saveChecklists, totalItems,
  type LaunchChecklist,
} from '@/lib/launch-checklist'

const TOTAL = totalItems()

function phasePct(completedItems: string[], phaseId: string): number {
  const phase = LAUNCH_PHASES.find((p) => p.id === phaseId)
  if (!phase) return 0
  const done = phase.items.filter((i) => completedItems.includes(i.id)).length
  return Math.round((done / phase.items.length) * 100)
}

function overallPct(completedItems: string[]): number {
  return Math.round((completedItems.length / TOTAL) * 100)
}

interface ChecklistViewProps {
  list: LaunchChecklist
  onChange: (updated: LaunchChecklist) => void
  onDelete: () => void
}

function ChecklistView({ list, onChange, onDelete }: ChecklistViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['research']))
  const pct = overallPct(list.completedItems)

  function togglePhase(id: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleItem(itemId: string) {
    const next = list.completedItems.includes(itemId)
      ? list.completedItems.filter((i) => i !== itemId)
      : [...list.completedItems, itemId]
    onChange({ ...list, completedItems: next })
  }

  const barColor = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-indigo-500' : 'bg-amber-500'

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{list.productName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {list.completedItems.length} / {TOTAL} tasks completed
          </p>
        </div>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">Overall Progress</span>
          <span className={`font-bold ${pct === 100 ? 'text-green-600' : 'text-gray-700'}`}>{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        {pct === 100 && (
          <div className="mt-2 flex items-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> Launch complete! 🎉
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {LAUNCH_PHASES.map((phase) => {
          const pp = phasePct(list.completedItems, phase.id)
          const open = expandedPhases.has(phase.id)
          const allDone = pp === 100

          return (
            <div key={phase.id} className={`rounded-xl border ${allDone ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-lg">{phase.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{phase.title}</span>
                    {allDone && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-32">
                      <div
                        className={`h-full rounded-full ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pp}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{pp}%</span>
                  </div>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mt-3 mb-3">{phase.description}</p>
                  <div className="space-y-3">
                    {phase.items.map((item) => {
                      const done = list.completedItems.includes(item.id)
                      return (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${done ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <button onClick={() => toggleItem(item.id)} className="mt-0.5 shrink-0">
                            {done
                              ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                              : <Circle className="h-5 w-5 text-gray-300 hover:text-indigo-400" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.label}
                            </p>
                            {!done && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                            )}
                            {!done && item.link && (
                              <Link
                                href={item.link}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1 font-medium"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {item.linkLabel}
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LaunchPage() {
  const [checklists, setChecklists] = useState<LaunchChecklist[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const loaded = loadChecklists()
    setChecklists(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
  }, [])

  const persist = useCallback((lists: LaunchChecklist[]) => {
    setChecklists(lists)
    saveChecklists(lists)
  }, [])

  function createChecklist() {
    if (!newName.trim()) return
    const list: LaunchChecklist = {
      id: `launch-${Date.now()}`,
      productName: newName.trim(),
      createdAt: new Date().toISOString(),
      completedItems: [],
    }
    const next = [list, ...checklists]
    persist(next)
    setActiveId(list.id)
    setShowNew(false)
    setNewName('')
  }

  function updateChecklist(updated: LaunchChecklist) {
    persist(checklists.map((c) => (c.id === updated.id ? updated : c)))
  }

  function deleteChecklist(id: string) {
    if (!confirm('Delete this checklist?')) return
    const next = checklists.filter((c) => c.id !== id)
    persist(next)
    setActiveId(next.length > 0 ? next[0].id : null)
  }

  const active = checklists.find((c) => c.id === activeId) ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Rocket className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Launch</h1>
              <p className="text-sm text-gray-600">Step-by-step checklist from idea to first sale.</p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" /> New Launch
          </button>
        </div>
      </div>

      {/* New checklist form */}
      {showNew && (
        <div className="bg-white border border-rose-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Start a new launch</h3>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createChecklist()}
              placeholder="Product name (e.g. AI Business Planner)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
            <button onClick={createChecklist} disabled={!newName.trim()} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
              Create
            </button>
            <button onClick={() => setShowNew(false)} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checklist tabs */}
      {checklists.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {checklists.map((c) => {
            const pct = overallPct(c.completedItems)
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeId === c.id
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {c.productName}
                <span className={`text-xs ${activeId === c.id ? 'text-rose-100' : 'text-gray-400'}`}>{pct}%</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Active checklist */}
      {active ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ChecklistView
            list={active}
            onChange={updateChecklist}
            onDelete={() => deleteChecklist(active.id)}
          />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Rocket className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">No launches yet</p>
          <p className="text-sm mt-1 mb-4">Create a checklist to track your next product launch end-to-end.</p>
          <button onClick={() => setShowNew(true)} className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">
            Start First Launch
          </button>
        </div>
      )}
    </div>
  )
}

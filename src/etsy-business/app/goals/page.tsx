'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Target, Plus, Pencil, Trash2, CheckCircle2, AlertCircle, TrendingUp,
  ChevronDown, ChevronUp, X, Save
} from 'lucide-react'
import {
  type RevenueGoal, loadGoals, saveGoals, upsertGoal, deleteGoal, newGoal,
  getCurrentMonthKey, getMonthLabel, getDaysInMonth, getDayOfMonth,
  computeProjection, getCoachingTips
} from '@/lib/goals'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function ProgressRing({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (clamped / 100) * circ
  const color = pct >= 100 ? '#22c55e' : pct >= 70 ? '#eab308' : '#ef4444'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="700" fill={color}>
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

interface GoalFormProps {
  initial: RevenueGoal
  onSave: (g: RevenueGoal) => void
  onCancel: () => void
}

function GoalForm({ initial, onSave, onCancel }: GoalFormProps) {
  const [g, setG] = useState(initial)
  const set = (k: keyof RevenueGoal, v: string | number) => setG((prev) => ({ ...prev, [k]: v }))
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 3 + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: getMonthLabel(key) }
  })

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">{initial.actualRevenue === 0 && initial.targetRevenue === 1000 ? 'New Goal' : 'Edit Goal'}</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
          <select value={g.month} onChange={(e) => set('month', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Target ($)</label>
          <input type="number" min={0} value={g.targetRevenue} onChange={(e) => set('targetRevenue', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Actual Revenue ($)</label>
          <input type="number" min={0} value={g.actualRevenue} onChange={(e) => set('actualRevenue', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Units Sold</label>
          <input type="number" min={0} value={g.unitsSold} onChange={(e) => set('unitsSold', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Avg Order Value ($)</label>
          <input type="number" min={1} value={g.avgOrderValue} onChange={(e) => set('avgOrderValue', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <input value={g.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. launched new product, ran sale…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(g)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Save className="h-4 w-4" /> Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface GoalCardProps {
  goal: RevenueGoal
  isCurrent: boolean
  onEdit: () => void
  onDelete: () => void
}

function GoalCard({ goal, isCurrent, onEdit, onDelete }: GoalCardProps) {
  const proj = computeProjection(goal)
  const pct = goal.targetRevenue > 0 ? (goal.actualRevenue / goal.targetRevenue) * 100 : 0
  const tips = getCoachingTips(goal, proj)
  const [showTips, setShowTips] = useState(isCurrent)
  const totalDays = getDaysInMonth(goal.month)
  const daysPassed = isCurrent ? Math.min(getDayOfMonth(), totalDays) : totalDays

  return (
    <div className={`bg-white rounded-xl border ${isCurrent ? 'border-indigo-300 shadow-md' : 'border-gray-200'} p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{getMonthLabel(goal.month)}</h3>
            {isCurrent && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
            {pct >= 100 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          {goal.notes && <p className="text-xs text-gray-500 mt-0.5">{goal.notes}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <ProgressRing pct={pct} />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Actual</span>
            <span className="font-semibold text-gray-900">{fmt(goal.actualRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Target</span>
            <span className="font-medium text-gray-700">{fmt(goal.targetRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Units sold</span>
            <span className="font-medium text-gray-700">{goal.unitsSold}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Avg order</span>
            <span className="font-medium text-gray-700">{fmt(goal.avgOrderValue)}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {isCurrent && (
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Day {daysPassed} of {totalDays}</span>
            <span>{proj.daysLeft} days left</span>
          </div>
        )}
      </div>

      {/* Projection (current month only) */}
      {isCurrent && pct < 100 && (
        <div className={`rounded-lg px-3 py-2 mb-3 flex items-start gap-2 ${proj.onTrack ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          {proj.onTrack
            ? <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
          <div className="text-xs">
            <p className={`font-medium ${proj.onTrack ? 'text-green-800' : 'text-amber-800'}`}>
              {proj.onTrack ? 'On track' : 'Behind pace'}
            </p>
            <p className={proj.onTrack ? 'text-green-700' : 'text-amber-700'}>
              Projected: {fmt(proj.projectedRevenue)}
              {!proj.onTrack && ` · Gap: ${fmt(proj.gapAmount)}`}
            </p>
          </div>
        </div>
      )}

      {/* Coaching tips */}
      {tips.length > 0 && (
        <div>
          <button onClick={() => setShowTips(!showTips)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            {showTips ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showTips ? 'Hide' : 'Show'} coaching tips
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-indigo-400 font-bold shrink-0">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<RevenueGoal[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const currentMonth = getCurrentMonthKey()

  useEffect(() => {
    const loaded = loadGoals()
    if (loaded.length === 0) {
      const demo = newGoal(currentMonth)
      demo.targetRevenue = 1500
      demo.actualRevenue = 620
      demo.unitsSold = 28
      demo.avgOrderValue = 22
      demo.notes = 'Launched social media bundle'
      setGoals([demo])
    } else {
      setGoals(loaded)
    }
  }, [currentMonth])

  const persist = useCallback((next: RevenueGoal[]) => {
    setGoals(next)
    saveGoals(next)
  }, [])

  function handleSave(g: RevenueGoal) {
    persist(upsertGoal(goals, g))
    setEditingId(null)
    setShowNewForm(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this goal?')) return
    persist(deleteGoal(goals, id))
  }

  const totalRevenue = goals.reduce((s, g) => s + g.actualRevenue, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetRevenue, 0)
  const totalUnits = goals.reduce((s, g) => s + g.unitsSold, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Goals</h1>
              <p className="text-gray-600 text-sm">Track monthly targets and get AI coaching to hit them.</p>
            </div>
          </div>
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {goals.length > 1 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: fmt(totalRevenue) },
            { label: 'Total Target', value: fmt(totalTarget) },
            { label: 'Total Units Sold', value: totalUnits.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New goal form */}
      {showNewForm && (
        <div className="mb-6">
          <GoalForm
            initial={newGoal(currentMonth)}
            onSave={handleSave}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Goal cards */}
      <div className="space-y-4">
        {goals.map((goal) =>
          editingId === goal.id ? (
            <GoalForm key={goal.id} initial={goal} onSave={handleSave} onCancel={() => setEditingId(null)} />
          ) : (
            <GoalCard
              key={goal.id}
              goal={goal}
              isCurrent={goal.month === currentMonth}
              onEdit={() => { setEditingId(goal.id); setShowNewForm(false) }}
              onDelete={() => handleDelete(goal.id)}
            />
          )
        )}
      </div>

      {goals.length === 0 && !showNewForm && (
        <div className="text-center py-16 text-gray-400">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-gray-500">No goals yet</p>
          <p className="text-sm mt-1 mb-4">Set your first monthly revenue target to start tracking.</p>
          <button onClick={() => setShowNewForm(true)} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Create First Goal
          </button>
        </div>
      )}
    </div>
  )
}

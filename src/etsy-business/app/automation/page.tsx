'use client'

import { useState } from 'react'
import { Play, Clock, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_AUTOMATIONS } from '@/lib/mock-data'
import { AutomationTask } from '@/lib/types'

const QUICK_ACTIONS = [
  { id: 'gen-product', label: 'Generate New Product', desc: 'AI creates a new product idea for your top niche', color: 'bg-purple-500', icon: '✨' },
  { id: 'create-listing', label: 'Create Etsy Listing', desc: 'Auto-generate listing with title, tags, description', color: 'bg-blue-500', icon: '📝' },
  { id: 'build-bundle', label: 'Build Bundle', desc: 'AI picks your best products and creates a bundle', color: 'bg-indigo-500', icon: '📦' },
  { id: 'seo-refresh', label: 'SEO Refresh', desc: 'Update all listing titles and tags for better search', color: 'bg-green-500', icon: '🔍' },
  { id: 'content-campaign', label: 'Content Campaign', desc: 'Generate a week of Pinterest & social content', color: 'bg-pink-500', icon: '📣' },
]

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  running: <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />,
  idle: <Clock className="w-4 h-4 text-gray-400" />,
}

export default function AutomationPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>(MOCK_AUTOMATIONS)
  const [runningAction, setRunningAction] = useState<string | null>(null)

  const runTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t))
    await new Promise(r => setTimeout(r, 2000))
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', lastRun: new Date().toISOString() } : t))
  }

  const runQuickAction = async (actionId: string) => {
    setRunningAction(actionId)
    await new Promise(r => setTimeout(r, 2000))
    setRunningAction(null)
  }

  return (
    <div>
      <Header title="Automation Hub" subtitle="One-click workflows for your Etsy business" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle><div className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" />Quick Actions</div></CardTitle></CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <button key={action.id} onClick={() => runQuickAction(action.id)} disabled={runningAction === action.id}
                className="p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left group disabled:opacity-60">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-xl mb-3`}>{action.icon}</div>
                <div className="font-medium text-sm text-gray-900 mb-1">{action.label}</div>
                <div className="text-xs text-gray-500">{action.desc}</div>
                {runningAction === action.id && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600">
                    <Loader2 className="w-3 h-3 animate-spin" />Running...
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Scheduled Workflows</h3>
            <Badge variant="indigo">{tasks.filter(t => t.trigger === 'scheduled').length} active schedules</Badge>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trigger</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Run</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{task.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={task.trigger === 'scheduled' ? 'blue' : task.trigger === 'event' ? 'purple' : 'gray'}>{task.trigger}</Badge>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {STATUS_ICON[task.status]}
                      <span className={`text-xs ${task.status === 'success' ? 'text-green-600' : task.status === 'error' ? 'text-red-600' : task.status === 'running' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {task.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="secondary" size="sm" onClick={() => runTask(task.id)} disabled={task.status === 'running'}>
                      {task.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Run
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

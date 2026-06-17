'use client'

import { useState } from 'react'
import { Zap, Play, Clock, CheckCircle, XCircle, Loader, Settings } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_AUTOMATIONS } from '@/lib/mock-data'
import { AutomationTask } from '@/lib/types'
import { formatCurrency } from '@/lib/analytics'

const CATEGORY_COLORS: Record<string, 'blue' | 'purple' | 'green' | 'yellow' | 'indigo'> = {
  seo: 'blue',
  content: 'purple',
  pricing: 'green',
  research: 'yellow',
  analytics: 'indigo',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  idle: <Clock className="w-4 h-4 text-gray-400" />,
  running: <Loader className="w-4 h-4 text-blue-500 animate-spin" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
}

const QUICK_AUTOMATIONS = [
  { label: 'SEO Audit All Products', description: 'Analyze and score SEO for all listings', icon: '🔍', time: '~3 min', category: 'seo' },
  { label: 'Generate Weekly Content', description: '7 days of Pinterest + social posts', icon: '📅', time: '~2 min', category: 'content' },
  { label: 'Competitor Price Check', description: 'Monitor and report price changes', icon: '💰', time: '~1 min', category: 'research' },
  { label: 'Update All SEO Tags', description: 'Refresh tags for trending keywords', icon: '🏷️', time: '~4 min', category: 'seo' },
  { label: 'Analytics Report', description: 'Generate monthly performance report', icon: '📊', time: '~1 min', category: 'analytics' },
  { label: 'Expansion Suggestions', description: 'AI suggestions for new product variants', icon: '🌿', time: '~2 min', category: 'content' },
]

export default function AutomationPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>(MOCK_AUTOMATIONS)
  const [runningTask, setRunningTask] = useState<string | null>(null)

  const runTask = async (taskId: string) => {
    setRunningTask(taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t))
    await new Promise(r => setTimeout(r, 2000))
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', lastRun: new Date().toISOString() } : t))
    setRunningTask(null)
  }

  return (
    <div>
      <Header
        title="Automation Hub"
        subtitle="One-click workflows to automate your Etsy business"
      />

      <div className="p-6 space-y-6">
        {/* Quick Run */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Automations</CardTitle>
            <Badge variant="indigo">AI Powered</Badge>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_AUTOMATIONS.map((auto) => (
              <div key={auto.label} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                <div className="text-2xl">{auto.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{auto.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{auto.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">Est: {auto.time}</span>
                    <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3 h-3" />
                      Run
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Scheduled Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Tasks</CardTitle>
            <Button size="sm" variant="secondary">
              <Settings className="w-4 h-4" />
              Configure
            </Button>
          </CardHeader>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-shrink-0">
                  {STATUS_ICONS[task.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{task.name}</p>
                    <Badge variant={CATEGORY_COLORS[task.category] || 'gray'}>{task.category}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                  {task.lastRun && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last run: {new Date(task.lastRun).toLocaleString()}
                    </p>
                  )}
                  {task.schedule && (
                    <p className="text-xs text-indigo-500 mt-0.5 font-mono">{task.schedule}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={
                    task.status === 'success' ? 'green' :
                    task.status === 'running' ? 'blue' :
                    task.status === 'error' ? 'red' : 'gray'
                  }>
                    {task.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => runTask(task.id)}
                    isLoading={runningTask === task.id}
                    disabled={task.status === 'running'}
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

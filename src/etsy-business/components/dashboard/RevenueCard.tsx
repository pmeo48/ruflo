import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/analytics'

interface RevenueCardProps {
  label: string
  value: number
  change?: number
  period?: string
  icon?: React.ReactNode
  color?: string
}

export function RevenueCard({ label, value, change, period, icon, color = 'indigo' }: RevenueCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(value)}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {period && <span className="text-gray-400 font-normal">vs {period}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <div className={`text-${color}-600`}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

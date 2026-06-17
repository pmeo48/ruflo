import { clsx } from 'clsx'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
}

export function Card({ className, children, hover }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-6',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('text-base font-semibold text-gray-900', className)}>{children}</h3>
}

interface SEOAnalyzerProps {
  score: number
  titleLength: number
  tagCount: number
  descriptionLength: number
}

export function SEOAnalyzer({ score, titleLength, tagCount, descriptionLength }: SEOAnalyzerProps) {
  const checks = [
    { label: 'Title optimized', ok: titleLength >= 60 && titleLength <= 140, note: `${titleLength}/140 chars` },
    { label: 'All 13 tags used', ok: tagCount >= 13, note: `${tagCount}/13 tags` },
    { label: 'Description complete', ok: descriptionLength >= 200, note: `${descriptionLength} chars` },
    { label: 'Keywords in title', ok: titleLength > 30, note: 'Primary keyword first' },
  ]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${score}, 100`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{score}</span>
          </div>
        </div>
        <div>
          <div className={`font-semibold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
          </div>
          <div className="text-xs text-gray-500">{score}/100 optimization score</div>
        </div>
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={check.ok ? 'text-green-500' : 'text-red-400'}>{check.ok ? 'v' : 'x'}</span>
              <span className={check.ok ? 'text-gray-700' : 'text-gray-400'}>{check.label}</span>
            </div>
            <span className="text-xs text-gray-400">{check.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

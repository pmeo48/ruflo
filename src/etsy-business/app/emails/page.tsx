'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Send, Eye, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

const EMAIL_SEQUENCES = [
  {
    id: 'welcome',
    name: 'Welcome Sequence',
    subject: "I made $197 while sleeping (here's how)",
    previewText: 'The exact passive income system I use on Etsy...',
    body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h2>Hey [First Name],</h2>
      <p>Yesterday morning I woke up to 3 new sales notifications.</p>
      <p><strong>$197 in passive income while I slept.</strong></p>
      <p>Here's the exact system I use:</p>
      <ol>
        <li>Create AI-powered digital products</li>
        <li>Optimize with the right keywords</li>
        <li>Let Etsy's search algorithm do the work</li>
      </ol>
      <p>Want the same system? <a href="#">Get the AI Business Growth Vault →</a></p>
    </div>`,
  },
  {
    id: 'launch',
    name: 'Product Launch',
    subject: 'New: AI Business Growth Vault — 60% off today only',
    previewText: 'Everything you need to build a 6-figure AI business...',
    body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h2>Hi [First Name],</h2>
      <p>The AI Business Growth Vault is now live.</p>
      <p>1,000+ prompts. 50+ templates. Complete business systems.</p>
      <p><strong>Regular price: $497 — Today only: $197</strong></p>
      <p><a href="#">Grab it before midnight →</a></p>
    </div>`,
  },
  {
    id: 'upsell',
    name: 'Upsell Sequence',
    subject: 'Limited time: 60% off ends tonight',
    previewText: 'Your last chance to get the full vault at this price...',
    body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h2>Hi [First Name],</h2>
      <p>Just a quick reminder that our Spring Sale ends at midnight.</p>
      <p>The AI Business Growth Vault is 60% off.</p>
      <p>Regular price: $497 &nbsp;|&nbsp; <strong>Today only: $197</strong></p>
      <p><a href="#">Grab it before midnight →</a></p>
    </div>`,
  },
]

export default function EmailsPage() {
  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; demo?: boolean; message?: string } | null>(null)

  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendResults, setSendResults] = useState<Record<string, { success?: boolean; demo?: boolean }>>({})
  const [seqEmail, setSeqEmail] = useState('')

  const isConfigured = false // Resolved server-side; client shows demo state by default

  const handleTestEmail = async () => {
    if (!testEmail) return
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSendSequence = async (seq: typeof EMAIL_SEQUENCES[0]) => {
    const recipient = seqEmail || 'demo@example.com'
    setSendingId(seq.id)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: seq.subject,
          htmlBody: seq.body,
          previewText: seq.previewText,
        }),
      })
      const data = await res.json()
      setSendResults(prev => ({ ...prev, [seq.id]: data }))
    } catch {
      setSendResults(prev => ({ ...prev, [seq.id]: { success: false } }))
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div>
      <Header title="Email Center" subtitle="Order confirmations and marketing email delivery via Resend" />
      <div className="p-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Emails Sent Today', value: '0' },
            { label: 'Open Rate', value: '—%' },
            { label: 'Click Rate', value: '—%' },
          ].map(stat => (
            <Card key={stat.label}>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Email Delivery Status</CardTitle>
            <Badge variant={isConfigured ? 'green' : 'yellow'}>
              {isConfigured ? 'Active' : 'Demo Mode'}
            </Badge>
          </CardHeader>
          <div className="flex items-start gap-3 mb-6">
            {isConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isConfigured ? 'Email delivery active via Resend' : 'Demo mode — emails simulated'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {isConfigured
                  ? 'RESEND_API_KEY is configured. Order confirmation emails will be sent automatically after each purchase.'
                  : 'Add RESEND_API_KEY to .env.local to enable real email delivery. All calls return demo responses.'}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Send a test order confirmation email</p>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="your@email.com"
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTestEmail} disabled={testLoading || !testEmail} size="sm">
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test
              </Button>
            </div>
            {testResult && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${testResult.success ? 'text-green-700' : 'text-red-600'}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.demo
                  ? 'Demo mode — RESEND_API_KEY not set. Email was simulated successfully.'
                  : testResult.success
                  ? 'Test email sent successfully!'
                  : 'Failed to send test email.'}
              </div>
            )}
          </div>
        </Card>

        {/* Order Confirmation Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Order Confirmation Template</CardTitle>
            <Badge variant="indigo">Auto-triggered</Badge>
          </CardHeader>
          <p className="text-sm text-gray-500 mb-4">
            Automatically sent after every purchase via the Stripe webhook. Includes product name, order ID, amount paid, and download link when available.
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Email Preview</span>
            </div>
            <div className="p-4 bg-white">
              <div style={{ fontFamily: 'sans-serif', maxWidth: '100%' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '20px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
                  <p style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: '16px' }}>Thank You for Your Purchase! 🎉</p>
                  <p style={{ color: '#a5b4fc', margin: '4px 0 0', fontSize: '12px' }}>Order #A1B2C3D4</p>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', padding: '20px', borderRadius: '0 0 8px 8px' }}>
                  <p style={{ color: '#374151', fontSize: '14px', margin: '0 0 8px' }}>Hi there,</p>
                  <p style={{ color: '#374151', fontSize: '14px', margin: '0 0 12px' }}>Your order is confirmed. Here's what you purchased:</p>
                  <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '14px' }}>AI Business Growth Vault</p>
                      <p style={{ color: '#6b7280', margin: '2px 0 0', fontSize: '12px' }}>bundle • Digital Download</p>
                    </div>
                    <p style={{ fontWeight: 700, color: '#059669', fontSize: '16px', margin: 0 }}>$197.00</p>
                  </div>
                  <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '10px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', display: 'inline-block' }}>
                      ⬇️ Download Your Product
                    </span>
                    <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '6px' }}>Link expires in 48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Email Sequences */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing Email Sequences</CardTitle>
            <Badge variant="purple">3 sequences</Badge>
          </CardHeader>
          <div className="mb-4">
            <Input
              placeholder="Recipient email for testing (optional)"
              type="email"
              value={seqEmail}
              onChange={e => setSeqEmail(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="space-y-3">
            {EMAIL_SEQUENCES.map(seq => {
              const result = sendResults[seq.id]
              const sending = sendingId === seq.id
              return (
                <div key={seq.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <p className="font-medium text-sm text-gray-900">{seq.name}</p>
                      </div>
                      <p className="text-xs text-gray-600 mb-0.5">
                        <span className="font-medium">Subject:</span> {seq.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{seq.previewText}</p>
                      {result && (
                        <p className={`text-xs mt-1.5 ${result.success ? 'text-green-600' : 'text-red-500'}`}>
                          {result.demo
                            ? 'Demo sent — add RESEND_API_KEY for real delivery'
                            : result.success
                            ? 'Sent successfully!'
                            : 'Send failed'}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSendSequence(seq)}
                      disabled={sending}
                    >
                      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send to List
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

      </div>
    </div>
  )
}

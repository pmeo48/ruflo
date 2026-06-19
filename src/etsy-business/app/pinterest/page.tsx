'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2, Loader2, Check, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

const TABS = ['Auto-Post', 'My Pins', 'Boards'] as const
type Tab = typeof TABS[number]

interface Pin {
  id: string
  title: string
  description?: string
  link?: string
  created_at?: string
}

interface Board {
  id: string
  name: string
  description?: string
  pin_count?: number
}

interface PostResult {
  productId: string
  pinId?: string
  title?: string
  status: string
  error?: string
}

export default function PinterestPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Auto-Post')
  const [configured, setConfigured] = useState(false)
  const [pins, setPins] = useState<Pin[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set())
  const [posting, setPosting] = useState(false)
  const [postingProductId, setPostingProductId] = useState<string | null>(null)
  const [storeUrl, setStoreUrl] = useState('https://yourstore.com/store')
  const [loadingPins, setLoadingPins] = useState(false)
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [defaultBoardId, setDefaultBoardId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState({ title: '', description: '', link: '', imageUrl: '' })
  const [creatingPin, setCreatingPin] = useState(false)
  const [showPinForm, setShowPinForm] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const fetchPins = useCallback(async () => {
    setLoadingPins(true)
    try {
      const res = await fetch('/api/pinterest/pins')
      const data = await res.json()
      setPins(data.pins ?? [])
      setConfigured(data.configured ?? false)
    } catch {
      // silent
    } finally {
      setLoadingPins(false)
    }
  }, [])

  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true)
    try {
      const res = await fetch('/api/pinterest/boards')
      const data = await res.json()
      setBoards(data.boards ?? [])
    } catch {
      // silent
    } finally {
      setLoadingBoards(false)
    }
  }, [])

  useEffect(() => {
    fetchPins()
    fetchBoards()
  }, [fetchPins, fetchBoards])

  const postAllProducts = async () => {
    setPosting(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/pinterest/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl }),
      })
      const data = await res.json()
      if (data.posted) {
        const ids = new Set<string>(
          (data.posted as PostResult[])
            .filter((r) => r.status === 'fulfilled' || r.status === 'demo')
            .map((r) => r.productId)
        )
        setPostedIds((prev) => {
          const next = new Set(prev)
          ids.forEach((id) => next.add(id))
          return next
        })
      }
      setStatusMsg(data.message ?? `Posted ${data.posted?.length ?? 0} pins successfully.`)
    } catch {
      setStatusMsg('Failed to post pins. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const postSingleProduct = async (productId: string) => {
    setPostingProductId(productId)
    const product = MOCK_PRODUCTS.find((p) => p.id === productId)
    if (!product) return
    try {
      const res = await fetch('/api/pinterest/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId], storeUrl }),
      })
      const data = await res.json()
      if (data.success) {
        setPostedIds((prev) => { const next = new Set(prev); next.add(productId); return next })
      }
    } catch {
      // silent
    } finally {
      setPostingProductId(null)
    }
  }

  const createNewPin = async () => {
    if (!newPin.title || !newPin.link) return
    setCreatingPin(true)
    try {
      const res = await fetch('/api/pinterest/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPin),
      })
      const data = await res.json()
      setPins((prev) => [data, ...prev])
      setNewPin({ title: '', description: '', link: '', imageUrl: '' })
      setShowPinForm(false)
    } catch {
      // silent
    } finally {
      setCreatingPin(false)
    }
  }

  const totalPins = boards.reduce((sum, b) => sum + (b.pin_count ?? 0), 0)

  return (
    <div>
      <Header title="Pinterest" subtitle="Auto-post product pins to drive Etsy traffic" />
      <div className="p-6 space-y-6">

        {/* Status banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${configured ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${configured ? 'bg-green-500' : 'bg-amber-400'}`} />
          {configured
            ? 'Pinterest API connected. Pins will be posted to your real account.'
            : 'Demo mode — add PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID to .env to enable real posting.'}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="py-4">
            <div className="text-2xl font-bold text-gray-900">{boards.length}</div>
            <div className="text-xs text-gray-500 mt-1">Boards</div>
          </Card>
          <Card className="py-4">
            <div className="text-2xl font-bold text-gray-900">{totalPins}</div>
            <div className="text-xs text-gray-500 mt-1">Total Pins</div>
          </Card>
          <Card className="py-4">
            <div className="text-2xl font-bold text-gray-900">{postedIds.size}</div>
            <div className="text-xs text-gray-500 mt-1">Posted This Session</div>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-gray-200 px-6">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Tab: Auto-Post */}
            {activeTab === 'Auto-Post' && (
              <div className="space-y-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Input label="Store URL (for UTM tracking)" value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="https://yourstore.com/store" />
                  </div>
                  <Button onClick={postAllProducts} disabled={posting} className="flex-shrink-0">
                    {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {posting ? 'Posting...' : 'Post All Products'}
                  </Button>
                </div>

                {statusMsg && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-indigo-50 text-indigo-800 rounded-lg text-sm border border-indigo-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {statusMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {MOCK_PRODUCTS.map((product) => {
                    const isPosted = postedIds.has(product.id)
                    const isPostingThis = postingProductId === product.id
                    return (
                      <div key={product.id} className="flex items-start justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                            {isPosted && <Badge variant="green">Posted</Badge>}
                          </div>
                          <Badge variant="indigo" className="text-xs">{product.type}</Badge>
                          <div className="text-xs text-gray-500 mt-1">${product.price} &bull; {product.sales} sales</div>
                        </div>
                        <Button size="sm" variant={isPosted ? 'secondary' : 'primary'}
                          disabled={isPostingThis}
                          onClick={() => postSingleProduct(product.id)}>
                          {isPostingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : isPosted ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                          {isPosted ? 'Posted' : 'Post Pin'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: My Pins */}
            {activeTab === 'My Pins' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Pins ({pins.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={fetchPins} disabled={loadingPins}>
                      <RefreshCw className={`w-4 h-4 ${loadingPins ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowPinForm((v) => !v)}>
                      {showPinForm ? 'Cancel' : 'Create New Pin'}
                    </Button>
                  </div>
                </div>

                {showPinForm && (
                  <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 space-y-3">
                    <h4 className="text-sm font-semibold text-indigo-900">New Pin</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Title" value={newPin.title} onChange={(e) => setNewPin((p) => ({ ...p, title: e.target.value }))} placeholder="Pin title" />
                      <Input label="Link" value={newPin.link} onChange={(e) => setNewPin((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                    </div>
                    <Input label="Description" value={newPin.description} onChange={(e) => setNewPin((p) => ({ ...p, description: e.target.value }))} placeholder="Describe this pin..." />
                    <Input label="Image URL (optional)" value={newPin.imageUrl} onChange={(e) => setNewPin((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
                    <Button onClick={createNewPin} disabled={creatingPin || !newPin.title || !newPin.link}>
                      {creatingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      Post to Pinterest
                    </Button>
                  </div>
                )}

                {loadingPins ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : pins.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No pins found.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {pins.map((pin) => (
                      <div key={pin.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-2">
                        <div className="font-medium text-sm text-gray-900 line-clamp-1">{pin.title}</div>
                        {pin.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{pin.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          {pin.created_at && (
                            <span className="text-xs text-gray-400">{new Date(pin.created_at).toLocaleDateString()}</span>
                          )}
                          {pin.link && (
                            <a href={pin.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Boards */}
            {activeTab === 'Boards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Boards ({boards.length})</CardTitle>
                  <Button size="sm" variant="secondary" onClick={fetchBoards} disabled={loadingBoards}>
                    <RefreshCw className={`w-4 h-4 ${loadingBoards ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {loadingBoards ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : boards.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No boards found.</div>
                ) : (
                  <div className="space-y-3">
                    {boards.map((board) => (
                      <div key={board.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{board.name}</span>
                            {defaultBoardId === board.id && <Badge variant="indigo">Default</Badge>}
                          </div>
                          {board.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{board.description}</p>
                          )}
                          {board.pin_count !== undefined && (
                            <span className="text-xs text-gray-400">{board.pin_count} pins</span>
                          )}
                        </div>
                        <Button size="sm" variant={defaultBoardId === board.id ? 'secondary' : 'ghost'}
                          onClick={() => setDefaultBoardId(board.id)}>
                          {defaultBoardId === board.id ? <Check className="w-3 h-3" /> : null}
                          {defaultBoardId === board.id ? 'Default' : 'Set as Default'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

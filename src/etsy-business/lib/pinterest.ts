const PINTEREST_BASE_URL = 'https://api.pinterest.com/v5'

const accessToken = process.env.PINTEREST_ACCESS_TOKEN
const boardId = process.env.PINTEREST_BOARD_ID

export const isPinterestConfigured = () => !!(accessToken && boardId)

async function pinterestRequest(path: string, options: RequestInit = {}) {
  if (!accessToken) throw new Error('Pinterest API not configured')
  const res = await fetch(`${PINTEREST_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Pinterest API error ${res.status}: ${error}`)
  }
  return res.json()
}

export interface PinData {
  title: string
  description: string
  link: string
  imageUrl?: string
  altText?: string
  boardId?: string
}

export async function createPin(pin: PinData) {
  const targetBoardId = pin.boardId || boardId
  if (!targetBoardId) throw new Error('No board ID configured')

  return pinterestRequest('/pins', {
    method: 'POST',
    body: JSON.stringify({
      board_id: targetBoardId,
      title: pin.title.slice(0, 100),
      description: pin.description.slice(0, 500),
      link: pin.link,
      alt_text: pin.altText?.slice(0, 500),
      media_source: pin.imageUrl ? {
        source_type: 'image_url',
        url: pin.imageUrl,
      } : {
        source_type: 'image_url',
        url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1000&q=80',
      },
    }),
  })
}

export async function getBoards() {
  return pinterestRequest('/boards?page_size=25')
}

export async function getBoard(id: string) {
  return pinterestRequest(`/boards/${id}`)
}

export async function getPins(targetBoardId?: string) {
  const id = targetBoardId || boardId
  if (!id) throw new Error('No board ID configured')
  return pinterestRequest(`/boards/${id}/pins?page_size=25`)
}

export async function getUserAccount() {
  return pinterestRequest('/user_account')
}

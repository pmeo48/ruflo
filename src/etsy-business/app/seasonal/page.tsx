'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight, Tag, Mail, Share2, Package, ExternalLink, Sparkles } from 'lucide-react'

interface SeasonalEvent {
  month: number  // 1-12
  day: number
  name: string
  emoji: string
  category: 'holiday' | 'seasonal' | 'awareness' | 'shopping'
  daysOut?: number  // how many days in advance to start preparing
  productIdeas: string[]
  pinterestAngles: string[]
  emailHooks: string[]
  keywords: string[]
}

const EVENTS: SeasonalEvent[] = [
  // January
  { month: 1, day: 1, name: 'New Year\'s Day', emoji: '🎆', category: 'holiday', daysOut: 21,
    productIdeas: ['Annual goal-setting workbook', 'Habit tracker printable', 'Word of the year journal', 'Vision board template'],
    pinterestAngles: ['New Year new me aesthetic', '2025 goal planning pins', 'Minimalist planner spreads'],
    emailHooks: ['Start the year right', 'Your 2025 planning toolkit is here', '12 months, 12 goals'],
    keywords: ['new year planner', 'goal setting template', 'habit tracker printable', '2025 vision board'] },
  { month: 1, day: 15, name: 'Martin Luther King Jr. Day', emoji: '✊', category: 'awareness', daysOut: 14,
    productIdeas: ['Diversity & inclusion training materials', 'Equity in the workplace guide', 'Social justice journaling prompts'],
    pinterestAngles: ['MLK quotes graphics', 'Civil rights history timelines', 'Community impact templates'],
    emailHooks: ['Honoring Dr. King\'s legacy', 'Resources for meaningful conversation'],
    keywords: ['social justice template', 'diversity training materials', 'equity planning guide'] },
  // February
  { month: 2, day: 1, name: 'Black History Month', emoji: '✊', category: 'awareness', daysOut: 7,
    productIdeas: ['Black history lesson plans', 'Entrepreneur spotlight templates', 'Heritage celebration materials'],
    pinterestAngles: ['Black excellence graphics', 'History education pins', 'Celebration templates'],
    emailHooks: ['Celebrate and educate all month long', 'Resources for Black History Month'],
    keywords: ['black history month', 'educator templates', 'history lesson plan printable'] },
  { month: 2, day: 14, name: 'Valentine\'s Day', emoji: '💝', category: 'holiday', daysOut: 21,
    productIdeas: ['Love letter template bundle', 'Date night planner', 'Relationship goal-setting workbook', 'Valentine\'s cards printable'],
    pinterestAngles: ['Valentine\'s gift guide aesthetic', 'Romantic printable ideas', 'DIY Valentine\'s crafts'],
    emailHooks: ['The gift that lasts (and doesn\'t wilt)', 'Love on a budget: digital gift ideas', 'Last-minute Valentine\'s? We\'ve got you'],
    keywords: ['valentine\'s day printable', 'love letter template', 'date night planner', 'couple goals worksheet'] },
  // March
  { month: 3, day: 8, name: 'International Women\'s Day', emoji: '♀️', category: 'awareness', daysOut: 14,
    productIdeas: ['Women in business resources', 'Female founder story templates', 'Empowerment affirmation cards'],
    pinterestAngles: ['Boss babe aesthetic', 'Women entrepreneur quotes', 'Feminist art prints'],
    emailHooks: ['Celebrating women who build', 'For the female founder in your life'],
    keywords: ['women in business template', 'female entrepreneur planner', 'empowerment journal'] },
  { month: 3, day: 17, name: 'St. Patrick\'s Day', emoji: '🍀', category: 'holiday', daysOut: 14,
    productIdeas: ['Lucky savings tracker', 'Spring financial goal planner', 'Green-themed activity printables'],
    pinterestAngles: ['St. Patrick\'s Day party printables', 'Lucky charm aesthetic pins'],
    emailHooks: ['Get lucky with your finances this spring', 'Feeling lucky? Your spring planner is ready'],
    keywords: ['st patrick\'s day printable', 'spring planner template', 'luck journal'] },
  { month: 3, day: 20, name: 'First Day of Spring', emoji: '🌸', category: 'seasonal', daysOut: 14,
    productIdeas: ['Spring cleaning checklist', 'Garden planner printable', 'Spring budget reset template', 'Seasonal meal planner'],
    pinterestAngles: ['Spring refresh home aesthetic', 'Pastel planner spreads', 'Floral template pins'],
    emailHooks: ['Spring clean your finances', 'New season, new systems', 'The spring reset bundle is live'],
    keywords: ['spring planner printable', 'spring cleaning checklist', 'garden planner template', 'seasonal budget'] },
  // April
  { month: 4, day: 1, name: 'April Fools\' Day', emoji: '🃏', category: 'awareness', daysOut: 7,
    productIdeas: ['Fun workplace icebreaker templates', 'Team building activity sheets'],
    pinterestAngles: ['Funny office printable pins', 'Team activity templates'],
    emailHooks: ['No joke — this deal is real', 'Seriously though, your best planning tool yet'],
    keywords: ['team building template', 'icebreaker activity printable', 'office fun worksheet'] },
  { month: 4, day: 15, name: 'Tax Day (US)', emoji: '📊', category: 'awareness', daysOut: 21,
    productIdeas: ['Small business tax prep checklist', 'Income & expense tracker spreadsheet', 'Self-employed tax guide PDF', 'Financial records organizer'],
    pinterestAngles: ['Tax season tips infographic', 'Self-employed finance pins', 'Budget tracker aesthetic'],
    emailHooks: ['Tax season survival kit', 'Get organized before April 15th', 'The freelancer\'s tax prep checklist'],
    keywords: ['tax prep checklist', 'small business tax template', 'income tracker spreadsheet', 'expense tracker printable'] },
  { month: 4, day: 22, name: 'Earth Day', emoji: '🌍', category: 'awareness', daysOut: 14,
    productIdeas: ['Sustainability challenge tracker', 'Eco-friendly home checklist', 'Zero waste planner printable'],
    pinterestAngles: ['Eco aesthetic pins', 'Sustainability tips infographic', 'Green lifestyle planner'],
    emailHooks: ['Go green with digital products (no paper!)', 'Earth-friendly planning tools'],
    keywords: ['sustainability tracker', 'eco friendly planner', 'zero waste checklist', 'green living template'] },
  // May
  { month: 5, day: 12, name: 'Mother\'s Day', emoji: '💐', category: 'holiday', daysOut: 21,
    productIdeas: ['Mom appreciation printable card', 'Family memory journal template', 'Recipe book organizer', 'Mom self-care planner'],
    pinterestAngles: ['Mother\'s Day gift ideas for digital products', 'Sentimental printable pins', 'Family photo book templates'],
    emailHooks: ['The gift she actually wants', 'For the mom who has everything (except time)', 'Last-minute Mother\'s Day? Instant download!'],
    keywords: ['mother\'s day printable', 'mom gift template', 'family journal', 'recipe organizer printable'] },
  { month: 5, day: 27, name: 'Memorial Day', emoji: '🇺🇸', category: 'holiday', daysOut: 14,
    productIdeas: ['Summer bucket list template', 'Patriotic event planning guide', 'BBQ party planner printable'],
    pinterestAngles: ['Memorial Day weekend aesthetic', 'Summer kickoff planning pins', 'Patriotic printable designs'],
    emailHooks: ['Memorial Day weekend planning toolkit', 'Summer starts now — are you ready?'],
    keywords: ['memorial day printable', 'summer planner template', 'party planning checklist', 'bbq party printable'] },
  // June
  { month: 6, day: 16, name: 'Father\'s Day', emoji: '👔', category: 'holiday', daysOut: 21,
    productIdeas: ['Dad gift certificate template', 'Father-child bucket list printable', 'Sports tracking spreadsheet', 'Retirement planning guide'],
    pinterestAngles: ['Father\'s Day gift guide pins', 'Dad humor printable aesthetic', 'Manly planner templates'],
    emailHooks: ['For the dad who deserves more than a tie', 'Digital gifts dads actually use', 'Father\'s Day sorted in 2 minutes'],
    keywords: ['father\'s day printable', 'dad gift template', 'sports tracker spreadsheet', 'gift certificate template'] },
  { month: 6, day: 21, name: 'First Day of Summer', emoji: '☀️', category: 'seasonal', daysOut: 14,
    productIdeas: ['Summer reading log printable', 'Vacation packing list template', 'Kids summer activity planner', 'Summer side hustle tracker'],
    pinterestAngles: ['Summer aesthetic planner pins', 'Beach vacation packing list', 'Kids activity summer pins'],
    emailHooks: ['Your summer planning toolkit', 'Make the most of every summer day', 'Pack smarter this vacation season'],
    keywords: ['summer planner printable', 'vacation packing list template', 'kids activity planner', 'summer bucket list'] },
  // July
  { month: 7, day: 4, name: 'Independence Day', emoji: '🎇', category: 'holiday', daysOut: 14,
    productIdeas: ['Patriotic party planner', 'Summer BBQ recipe organizer', 'Financial independence workbook'],
    pinterestAngles: ['4th of July party printable pins', 'Red white blue aesthetic', 'Patriotic party planning'],
    emailHooks: ['Celebrate your own financial independence', 'Freedom to work from anywhere toolkit'],
    keywords: ['4th of july printable', 'patriotic party planner', 'independence day template', 'bbq party organizer'] },
  // August
  { month: 8, day: 1, name: 'Back to School Season', emoji: '🎒', category: 'shopping', daysOut: 30,
    productIdeas: ['Student planner template', 'Homework tracker printable', 'Teacher lesson plan bundle', 'School supply checklist'],
    pinterestAngles: ['Back to school aesthetic', 'Student planner spreads', 'Teacher organization pins', 'Study tips infographic'],
    emailHooks: ['Get organized before the first bell', 'The student success toolkit', 'Teachers: your planning bundle is ready'],
    keywords: ['student planner printable', 'teacher lesson plan template', 'homework tracker', 'back to school checklist'] },
  // September
  { month: 9, day: 2, name: 'Labor Day', emoji: '🔨', category: 'holiday', daysOut: 14,
    productIdeas: ['Side hustle income tracker', 'Freelance invoice template bundle', 'Career goals workbook'],
    pinterestAngles: ['Work-life balance aesthetic', 'Hustle culture planner pins', 'Career planning infographics'],
    emailHooks: ['Work smarter, not harder — your toolkit', 'This Labor Day, invest in your business'],
    keywords: ['freelance invoice template', 'career planning workbook', 'side hustle tracker', 'income goal planner'] },
  { month: 9, day: 22, name: 'First Day of Fall', emoji: '🍂', category: 'seasonal', daysOut: 14,
    productIdeas: ['Fall home organization guide', 'Autumn meal planner', 'Q4 business planning workbook', 'Halloween party planner'],
    pinterestAngles: ['Cozy fall planner aesthetic', 'Autumn color palette templates', 'Fall recipe collection pins'],
    emailHooks: ['Fall into great habits with our planner', 'Q4 is make-or-break — are you ready?', 'Cozy season calls for cozy systems'],
    keywords: ['fall planner printable', 'autumn organization template', 'q4 business planner', 'fall meal planner'] },
  // October
  { month: 10, day: 31, name: 'Halloween', emoji: '🎃', category: 'holiday', daysOut: 21,
    productIdeas: ['Halloween party planner printable', 'Spooky activity sheets for kids', 'October reading challenge tracker', 'Costume budget planner'],
    pinterestAngles: ['Halloween aesthetic party planning', 'Spooky printable pins', 'Orange and black planner spreads'],
    emailHooks: ['No tricks — just treats in your inbox', 'Halloween planning sorted in minutes', 'Scary good deal this October'],
    keywords: ['halloween printable', 'halloween party planner', 'spooky activity sheets', 'october planner template'] },
  // November
  { month: 11, day: 1, name: 'Black Friday Prep', emoji: '🛒', category: 'shopping', daysOut: 30,
    productIdeas: ['Holiday gift budget spreadsheet', 'Black Friday deal tracker', 'Holiday shopping list printable', 'Etsy shop holiday prep checklist'],
    pinterestAngles: ['Holiday gift guide aesthetic', 'Black Friday planning pins', 'Holiday budget tracker spreads'],
    emailHooks: ['Your Black Friday shop is ready early', 'Holiday gift guide now live', 'Get ahead of the holiday rush'],
    keywords: ['black friday template', 'holiday gift list printable', 'christmas budget tracker', 'holiday shopping planner'] },
  { month: 11, day: 28, name: 'Thanksgiving', emoji: '🦃', category: 'holiday', daysOut: 21,
    productIdeas: ['Thanksgiving meal planner', 'Gratitude journal printable', 'Holiday hosting checklist', 'Family traditions workbook'],
    pinterestAngles: ['Thanksgiving table aesthetic', 'Gratitude journal pins', 'Holiday meal prep pins'],
    emailHooks: ['We\'re grateful for you — here\'s a gift', 'Thanksgiving planning toolkit', 'Stress-free holidays start here'],
    keywords: ['thanksgiving planner', 'gratitude journal printable', 'holiday meal planner', 'thanksgiving checklist'] },
  // December
  { month: 12, day: 1, name: 'Holiday Shopping Season', emoji: '🎁', category: 'shopping', daysOut: 45,
    productIdeas: ['Christmas gift guide template', 'Elf on the shelf activity cards', 'Holiday budget worksheet', 'December self-care planner'],
    pinterestAngles: ['Christmas aesthetic planner pins', 'Gift wrapping idea boards', 'Holiday decor template pins'],
    emailHooks: ['The gift they can open instantly', 'Give the gift of organization this holiday', '12 days of digital gifts'],
    keywords: ['christmas planner printable', 'holiday gift guide template', 'christmas budget worksheet', 'advent activity cards'] },
  { month: 12, day: 25, name: 'Christmas', emoji: '🎄', category: 'holiday', daysOut: 30,
    productIdeas: ['Christmas card template printable', 'Holiday family traditions journal', 'New Year\'s Eve party planner', 'Year-in-review reflection workbook'],
    pinterestAngles: ['Christmas card aesthetic pins', 'Holiday party planning boards', 'Cozy Christmas planner spreads'],
    emailHooks: ['An instant gift for Christmas morning', 'The perfect stocking stuffer — delivered instantly', 'Merry Christmas + a gift inside'],
    keywords: ['christmas card template', 'holiday journal printable', 'new year\'s eve party planner', 'christmas printable gift'] },
  { month: 12, day: 31, name: 'New Year\'s Eve', emoji: '🥂', category: 'holiday', daysOut: 21,
    productIdeas: ['Year-in-review reflection workbook', 'New Year goal-setting planner', 'Word of the year template', 'Next year business roadmap'],
    pinterestAngles: ['New Year\'s Eve party planning pins', 'Goal-setting aesthetic boards', 'New year new chapter graphics'],
    emailHooks: ['Out with the old, in with the planned', 'Ring in the new year with a clear roadmap', 'Your best year starts tonight'],
    keywords: ['new year\'s eve planner', 'year in review template', 'goal setting workbook', 'new year resolution planner'] },
]

const CATEGORY_COLORS: Record<string, string> = {
  holiday: 'bg-rose-100 text-rose-700 border-rose-200',
  seasonal: 'bg-green-100 text-green-700 border-green-200',
  awareness: 'bg-blue-100 text-blue-700 border-blue-200',
  shopping: 'bg-amber-100 text-amber-700 border-amber-200',
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function daysUntil(month: number, day: number): number {
  const now = new Date()
  const target = new Date(now.getFullYear(), month - 1, day)
  if (target < now) target.setFullYear(now.getFullYear() + 1)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function urgencyBadge(days: number): { label: string; color: string } {
  if (days <= 7) return { label: `${days}d away!`, color: 'bg-red-100 text-red-700 border-red-200' }
  if (days <= 14) return { label: `${days} days`, color: 'bg-orange-100 text-orange-700 border-orange-200' }
  if (days <= 30) return { label: `${days} days`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  return { label: `${days} days`, color: 'bg-gray-100 text-gray-600 border-gray-200' }
}

export default function SeasonalPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedEvent, setSelectedEvent] = useState<SeasonalEvent | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const upcoming = useMemo(() => {
    return [...EVENTS]
      .map((e) => ({ ...e, days: daysUntil(e.month, e.day) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 5)
  }, [])

  const monthEvents = EVENTS.filter((e) => e.month === selectedMonth)
    .filter((e) => filter === 'all' || e.category === filter)

  function prevMonth() { setSelectedMonth((m) => (m === 1 ? 12 : m - 1)) }
  function nextMonth() { setSelectedMonth((m) => (m === 12 ? 1 : m + 1)) }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="h-6 w-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seasonal Planner</h1>
        </div>
        <p className="text-gray-600">Plan products, Pinterest content, and email campaigns around seasonal events.</p>
      </div>

      {/* Upcoming strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Coming Up — Prepare Now</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {upcoming.map((e) => {
            const urgency = urgencyBadge(e.days)
            const needsAction = e.days <= (e.daysOut ?? 21)
            return (
              <button
                key={`${e.month}-${e.day}`}
                onClick={() => { setSelectedMonth(e.month); setSelectedEvent(e) }}
                className={`text-left p-2.5 rounded-lg border transition-colors hover:shadow-sm ${needsAction ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <p className="text-lg mb-0.5">{e.emoji}</p>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{e.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium mt-1 inline-block ${urgency.color}`}>
                  {urgency.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Month browser */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <h2 className="font-semibold text-gray-900">{MONTH_FULL[selectedMonth]}</h2>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['all', 'holiday', 'seasonal', 'shopping', 'awareness'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-xs px-2 py-1 rounded-full border capitalize transition-colors ${
                    filter === cat ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {monthEvents.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No events this month for this filter.</p>
              )}
              {monthEvents.map((e) => {
                const days = daysUntil(e.month, e.day)
                const isSelected = selectedEvent?.name === e.name
                return (
                  <button
                    key={`${e.month}-${e.day}`}
                    onClick={() => setSelectedEvent(isSelected ? null : e)}
                    className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                      isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES[e.month]} {e.day} · {days}d away</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[e.category]}`}>
                      {e.category}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Event detail */}
        <div className="md:col-span-2">
          {selectedEvent ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{selectedEvent.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.name}</h2>
                  <p className="text-sm text-gray-500">
                    {MONTH_FULL[selectedEvent.month]} {selectedEvent.day} ·{' '}
                    {daysUntil(selectedEvent.month, selectedEvent.day)} days away ·{' '}
                    Start preparing {selectedEvent.daysOut ?? 21} days out
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Product Ideas</h3>
                  <Link href="/ideas" className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Generate more
                  </Link>
                </div>
                <ul className="space-y-1">
                  {selectedEvent.productIdeas.map((idea) => (
                    <li key={idea} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-violet-400 mt-0.5">▸</span> {idea}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Pinterest Pin Angles</h3>
                  <Link href="/pinterest" className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Pin now
                  </Link>
                </div>
                <ul className="space-y-1">
                  {selectedEvent.pinterestAngles.map((angle) => (
                    <li key={angle} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-rose-400 mt-0.5">▸</span> {angle}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Email Subject Line Ideas</h3>
                  <Link href="/emails" className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Send email
                  </Link>
                </div>
                <ul className="space-y-1">
                  {selectedEvent.emailHooks.map((hook) => (
                    <li key={hook} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span className="italic">"{hook}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-teal-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Keywords to Target</h3>
                  <Link href="/keywords" className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Research →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center p-10 text-center text-gray-400">
              <div>
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium text-gray-500">Select an event</p>
                <p className="text-sm mt-1">Click any event in the calendar to see product ideas, Pinterest angles, email hooks, and keywords.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

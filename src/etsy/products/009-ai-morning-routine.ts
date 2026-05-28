export const PRODUCT_009 = {
  id: '009',
  title: 'AI Morning Routine Productivity System',
  subtitle: 'A 45-Minute AI-Powered Morning That Makes Every Day Your Most Productive',
  type: 'template' as const,
  niche: 'productivity',
  targetAudience: 'professionals, entrepreneurs, high performers wanting to start days powerfully',
  pages: 22,
  wordCount: 7000,
  fileFormats: ['PDF'] as string[],
  price: 6.99,
  philosophy: `Most morning routines fail because they're either too rigid (miss one day and you quit) or too vague (meditate! journal! exercise!). This system is different: it's built around your actual work goals, uses AI to make decisions faster, and takes exactly 45 minutes regardless of your morning chaos.

The core insight: your best thinking happens in the first 90 minutes after waking. Most people waste it on email and social media. This system uses AI to compress 2 hours of planning, learning, and creating into 45 purposeful minutes — so you hit the office (or Zoom) already winning.`,
  theRoutine: {
    overview: '45 minutes total: 5 min (Brief) + 10 min (Plan) + 15 min (Create) + 10 min (Learn) + 5 min (Review)',
    phases: [
      {
        minutes: 5,
        name: 'Morning Intelligence Briefing',
        description: "Get AI to synthesize your day's context and give you the right mindset.",
        prompt: `"Act as my morning briefing assistant. Today is [day, date].

My top priority today: [your #1 priority]
My biggest worry: [what's weighing on you]
Energy level: [low/medium/high]

Give me in under 150 words:
1. A reframe on my worry that puts it in perspective
2. The single most important thing to focus on today
3. One tactical reminder based on my priority
4. A confidence statement about my ability to handle today

Be direct, not fluffy. No generic motivation."`,
        tips: [
          'Save this prompt as a browser bookmark — open it every morning',
          'Change the worry and priority daily — that is what makes it personal',
          'If energy is low, ask AI to give you a simple, low-effort version of the plan',
        ],
        whyItWorks: 'Externalizing your morning anxiety to AI short-circuits rumination. You get an outside perspective in 30 seconds instead of spinning for 30 minutes.',
      },
      {
        minutes: 10,
        name: 'AI-Optimized Daily Planning',
        description: 'Use AI to prioritize ruthlessly and build a realistic schedule.',
        prompt: `"I have [X hours] of focused time today. Help me plan it.

My task list: [paste your tasks — rough is fine]

Constraints:
- Meetings: [list times]
- Energy: [when are you sharpest? morning/afternoon]
- Deadlines: [any hard deadlines today]

Build me:
1. A prioritized task list (mark which 1-2 are MUST DO)
2. A time-blocked schedule with realistic buffers
3. One task to DELETE or delegate — be ruthless
4. A reality check: what WON'T get done today (so I can reset expectations now)"`,
        tips: [
          'Do this before checking email — email will hijack your priorities',
          "Trust the AI's ruthless task deletion — your brain protects everything, AI doesn't",
          'Screenshot the final plan and put it in your taskbar',
        ],
        whyItWorks: 'Decision fatigue hits hardest on low-value decisions like "what should I work on now?" Outsourcing the sequencing to AI saves your best thinking for the actual work.',
      },
      {
        minutes: 15,
        name: 'Deep Work Creation Block',
        description: 'Your most important creative task, powered by AI for the hard parts.',
        prompts: [
          {
            task: 'Writing anything (email, report, proposal)',
            prompt: `"Give me an outline for [piece of writing] in [X words]. The reader is [audience]. My main argument is [X]. I want them to feel [Y] after reading. Three things I must include: [1, 2, 3]. Start writing at section 2 after I review the outline."`,
          },
          {
            task: 'Solving a complex problem',
            prompt: `"Help me think through this problem: [describe it clearly]. What I've already tried: [list]. What I believe the solution is: [your hypothesis]. Challenge my hypothesis and suggest 3 alternative approaches I might not have considered."`,
          },
          {
            task: 'Making a hard decision',
            prompt: `"I need to decide [X] by [date]. Option A: [describe]. Option B: [describe]. My gut says [A or B]. Play devil's advocate: make the strongest possible case for the option I'm NOT leaning toward. Then tell me what additional information would change your recommendation."`,
          },
          {
            task: 'Building or planning something',
            prompt: `"I'm building [what]. My current plan: [describe]. What are the 3 biggest risks I'm not accounting for? What would someone who has done this before tell me to do differently in week 1?"`,
          },
        ],
        tips: [
          'No email, no Slack, no notifications during this 15 minutes',
          'If you get stuck, type "I\'m stuck on [specific part]" to AI and keep going',
          'Done beats perfect — ship the 80% version and iterate',
        ],
        whyItWorks: "The first 15 minutes of focused work is the hardest. AI removes the blank-page problem and gives you momentum before your brain's resistance kicks in.",
      },
      {
        minutes: 10,
        name: 'Daily Learning Sprint',
        description: 'Learn something immediately relevant to your current goals.',
        prompt: `"Teach me the most important thing about [topic relevant to your current goal] that most professionals in my field don't know yet.

My context: [your role/industry]
Why I care: [why this topic matters to you now]

Format:
1. The insight in one clear sentence
2. Why 90% of people get this wrong
3. One counterintuitive implication
4. Exactly one thing I can do TODAY to apply this
5. The single best resource to go deeper (book, article, or course)

Under 200 words total."`,
        tips: [
          'Rotate topics: Monday = your industry, Tuesday = leadership, Wednesday = productivity, Thursday = a new skill, Friday = big-picture trends',
          'Take the "one thing I can do today" seriously — do it before the day ends',
          'Keep a learnings log in Notion — paste the best insights weekly',
        ],
        whyItWorks: '10 minutes of targeted daily learning equals 60 hours per year. Over 5 years, this compounds into expertise that most people never achieve.',
      },
      {
        minutes: 5,
        name: 'Weekly Review (Fridays Only)',
        description: 'Extract wins, lessons, and next week\'s priorities.',
        prompt: `"It's Friday. Help me close this week well.

Wins this week (even small ones): [list 2-3]
What didn't go as planned: [list 1-2]
What I learned: [any insight or lesson]
Next week's most important goal: [the one thing]

Give me:
1. An honest assessment of this week (what drove results vs what was busy work)
2. One habit or behavior that would have made this week better
3. My top 3 priorities for next week, in order
4. Something worth celebrating, even if it feels small"`,
        tips: [
          'Do this at 4:30 PM on Friday before your weekend starts',
          'Share your weekly wins with a colleague or accountability partner',
          'Archive these weekly reviews — they become invaluable career evidence',
        ],
      },
    ],
  },
  adaptations: [
    {
      role: 'Entrepreneur/Founder',
      adjustment: 'Extend Create block to 25 min, shorten Learn to 5 min. Focus Create block on the highest-revenue activity.',
      morningPromptAddition: 'Add to morning brief: "What is the one action today that will have the biggest impact on revenue in the next 30 days?"',
    },
    {
      role: 'Creative Professional',
      adjustment: 'Start with 5 min free writing before the Brief — clear your head before AI input. Use AI more for feedback than generation.',
      morningPromptAddition: 'Add to morning brief: "What creative risk should I take today?"',
    },
    {
      role: 'Manager/Executive',
      adjustment: 'Spend 5 of the Plan minutes on team priorities — who needs unblocking today? Use AI to draft your key messages and delegation notes.',
      morningPromptAddition: 'Add to plan: "Who on my team needs to hear from me today and what do they need?"',
    },
    {
      role: 'Non-Morning Person',
      adjustment: "Do this routine whenever you're sharpest — 11 AM is fine. The sequence matters more than the time. Remove the '5 min brief' and start with planning if coffee hasn't kicked in yet.",
      morningPromptAddition: 'Start with: "I have 30 minutes of focus time right now. What\'s the single most impactful thing I should do?"',
    },
  ],
  trackingTemplate: {
    daily: [
      'Did I complete the 45-min routine? (Y/N)',
      'My #1 priority today:',
      'Did I protect the 15-min Create block? (Y/N)',
      'One win from today:',
    ],
    weekly: [
      'Days I completed the routine:',
      'Biggest win of the week:',
      "What I'd do differently:",
      "Next week's #1 priority:",
    ],
  },
};

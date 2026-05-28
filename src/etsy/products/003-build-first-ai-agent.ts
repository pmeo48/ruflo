export const PRODUCT_003 = {
  id: '003',
  title: 'Build Your First AI Agent in a Weekend',
  subtitle: 'A Step-by-Step Guide Using No-Code Tools — From Zero to Working Agent in 48 Hours',
  type: 'guide' as const,
  niche: 'ai-tools',
  targetAudience: 'entrepreneurs, no-code enthusiasts, curious professionals, beginner developers',
  pages: 38,
  wordCount: 12000,
  fileFormats: ['PDF'] as string[],
  price: 14.99,
  sessions: [
    {
      session: 'Friday Evening (2 hours)',
      title: 'Planning & Setup',
      content: `What is an AI agent? An AI agent is software that perceives its environment, makes decisions, and takes actions to achieve a goal — automatically. Unlike a chatbot that just answers questions, an agent can: receive a trigger (like an incoming email), analyze it using AI, decide what action to take, and execute that action (file it, reply, create a task). Think of it as a smart assistant that actually does things, not just talks.

Your first agent project: We'll build an Email Intelligence Agent that reads your Gmail, classifies each email by importance, and routes it to the right folder automatically. By Sunday night, your inbox will organize itself.

Tools you need (all free to start):
• Gmail account
• n8n.io account (free cloud plan — sign up at n8n.io)
• OpenAI API key (sign up at platform.openai.com — $5 free credit = thousands of classifications)
• Optional: Notion account for task creation

Setup checklist:
1. Create n8n.io account at n8n.io/cloud
2. Create OpenAI account at platform.openai.com
3. Generate API key: Platform.openai.com → API Keys → Create new secret key → Copy it somewhere safe
4. Connect Gmail to n8n: In n8n, go to Credentials → New → Gmail OAuth2 → follow the Google authorization flow
5. Test connection: Create a simple workflow with a Gmail trigger — if it shows your recent emails, you're ready

Common setup errors:
• "Gmail OAuth failed": Make sure you're logged into the correct Google account in your browser before authorizing
• "API key not working": Check there are no spaces before/after when you paste it into n8n
• "Can't find the node": Use the search bar in n8n — type "Gmail" or "OpenAI"`,
      timeEstimate: '2 hours',
    },
    {
      session: 'Saturday Morning (3 hours)',
      title: 'Building the Trigger and Email Capture',
      content: `Step 1: Create a new workflow in n8n
Click "New Workflow" in n8n. Name it "Email Intelligence Agent". You'll see a blank canvas — this is where you'll connect nodes (building blocks) to create your automation.

Step 2: Add the Gmail Trigger node
Click the "+" button → search "Gmail" → select "Gmail Trigger". Configure it:
• Credential: Select the Gmail account you connected
• Event: "Message Received"
• Filters (optional): Leave blank to process all emails, or add "has:attachment" to only process emails with files
• Poll time: Every 1 minute (for testing) → change to Every 5 minutes when live

Step 3: Test the trigger
Click "Test step" — n8n will fetch your most recent email and show you the data structure. You'll see fields like: id, threadId, snippet, from, subject, date, body (decoded). This is the data your AI will analyze.

The email data structure you'll use:
• {{$json.from.value[0].address}} — sender email
• {{$json.subject}} — email subject line
• {{$json.text}} — plain text body (first 500 chars is usually enough)
• {{$json.date}} — when it was received

Step 4: Add a "Set" node to extract key fields
Add a Set node after Gmail Trigger. This cleans up the data:
• sender: {{$json.from.value[0].address}}
• subject: {{$json.subject}}
• bodyPreview: {{$json.text.slice(0, 500)}}
• emailId: {{$json.id}}

Why this matters: Sending the full email body to OpenAI wastes tokens and money. Extracting just the key fields keeps costs under $0.001 per email.`,
      timeEstimate: '3 hours',
    },
    {
      session: 'Saturday Afternoon (3 hours)',
      title: 'Adding the AI Brain',
      content: `Step 5: Add the OpenAI node
After your Set node, add an OpenAI node. Configure:
• Credential: Paste your OpenAI API key
• Resource: "Text"
• Operation: "Message a Model"
• Model: "gpt-4o-mini" (fast + cheap — perfect for classification)
• Messages:

System message (paste exactly):
"You are an email triage assistant. Classify every email into exactly one category. Return ONLY the category name — nothing else, no explanation, no punctuation.

Categories:
- URGENT: requires action within 24 hours, from a real person
- ACTION: requires action but not urgent (can wait 2-3 days)
- NEWSLETTER: newsletters, marketing emails, updates from services
- RECEIPT: invoices, order confirmations, receipts
- PERSONAL: from friends or family
- SPAM: unwanted email"

User message:
"From: {{sender}}
Subject: {{subject}}
Preview: {{bodyPreview}}

Category:"

Max tokens: 10 (we only need one word back)
Temperature: 0 (we want consistent, not creative)

Step 6: Test the classification
Run the workflow with a test email. In the output, look for: the AI's response in the "text" field. It should return exactly one word like "NEWSLETTER" or "URGENT".

Troubleshooting:
• Got a long response instead of one word? Add to your system message: "CRITICAL: Return ONLY the category name. No other text."
• Got an error? Check your API key is correct and you have credits
• Getting wrong classifications? Your first 20 emails will be ~85% accurate. It improves as you refine the prompt.`,
      timeEstimate: '3 hours',
    },
    {
      session: 'Saturday Evening (2 hours)',
      title: 'Adding Actions & Routing',
      content: `Step 7: Add a Switch node
After OpenAI, add a Switch node. This routes emails to different actions based on the AI's classification.

Configure the Switch node:
• Mode: "Rules"
• Rules:
  - Rule 1: {{$json.text}} equals "URGENT" → Output 1
  - Rule 2: {{$json.text}} equals "ACTION" → Output 2
  - Rule 3: {{$json.text}} equals "NEWSLETTER" → Output 3
  - Rule 4: {{$json.text}} equals "RECEIPT" → Output 4
  - Rule 5: Default → Output 5 (catches PERSONAL, SPAM, anything else)

Step 8: Add Gmail label actions
For each Switch output, add a Gmail node:
• Resource: "Thread"
• Operation: "Add Label"
• Thread ID: {{$('Gmail Trigger').item.json.threadId}}
• Label IDs: Create labels in Gmail first (Settings → Labels → Create label)
  - Create labels: "AI-Urgent", "AI-Action", "AI-Newsletter", "AI-Receipt"

Gmail label IDs: You need to use the label's ID not its name. In n8n, when you select "Label IDs", use the dropdown — n8n fetches your Gmail labels automatically.

Step 9: Optional — Create Notion tasks for URGENT emails
After the URGENT label action, add a Notion node:
• Operation: "Create Page"
• Database: Select your task database
• Fields: Title = {{subject}}, From = {{sender}}, Due = Today + 24h

Step 10: Test the full flow
Send yourself test emails of each type. Run the workflow manually. Watch as n8n processes each email: the Gmail trigger fires, Set extracts fields, OpenAI classifies, Switch routes, Gmail applies labels. When it works, your inbox is now automated.`,
      timeEstimate: '2 hours',
    },
    {
      session: 'Sunday (4 hours)',
      title: 'Deploy, Monitor & Build Your Next Agent',
      content: `Step 11: Activate your agent
Click "Active" toggle in n8n to turn your workflow on. It now runs every 5 minutes automatically. Leave it running for 48 hours and check how many emails it classified. Target: 85%+ accuracy in the right category.

Step 12: Fine-tuning (when you see mistakes)
If "newsletter" emails are classified as "ACTION", update your system prompt:
• Add examples: "NEWSLETTER example: 'This week's top content from [Brand]' or 'Your weekly digest is ready'"
• Add negative examples: "This is NOT URGENT: promotional emails, newsletters, auto-generated notifications"

Step 13: Monitoring your agent
In n8n, go to Executions to see every time your agent ran. You'll see: which emails it processed, what classifications it made, and any errors. Check it daily for the first week.

Cost tracking: Each email classification costs ~0.001 USD (1 cent per 1,000 emails). Even with 500 emails/month, you'll spend under $1/month on OpenAI.

Step 14: Your next 5 agents to build
Now that you understand the pattern (Trigger → Data → AI → Action), here are 5 more agents to build:

1. Social Media Monitor Agent: Triggers when someone mentions your brand on Twitter → AI analyzes sentiment → Routes to Slack if negative (requires social listening tool + Slack)

2. Content Repurposer Agent: Trigger when new blog post published → AI creates 3 LinkedIn posts + 5 tweets + 1 email newsletter section → Saves to Notion draft folder

3. Lead Scorer Agent: Trigger on new CRM entry → AI scores lead 1-10 based on role/company/message → Tags high-value leads for immediate follow-up

4. Invoice Tracker Agent: Trigger on new receipt/invoice email → AI extracts amount/vendor/date → Creates row in Google Sheets financial tracker

5. Customer FAQ Auto-Responder: Trigger on new support email → AI checks if it matches one of 20 FAQ answers → Drafts reply for human review → One-click send`,
      timeEstimate: '4 hours',
    },
  ],
  bonusPromptTemplates: [
    {
      name: 'Email Classification (used in tutorial)',
      prompt: `System: "You are an email triage assistant. Classify every email into exactly one category. Return ONLY the category name.\n\nCategories: URGENT (action needed in 24h), ACTION (action needed, not urgent), NEWSLETTER, RECEIPT, PERSONAL, SPAM"\n\nUser: "From: [sender]\nSubject: [subject]\nPreview: [first 500 chars of body]\n\nCategory:"`,
    },
    {
      name: 'Meeting Notes Summarizer',
      prompt: `"Summarize this meeting transcript in exactly this format:\n\n**Decisions Made** (bullet list)\n**Action Items** (bullet list with owner name)\n**Open Questions** (bullet list)\n**Next Meeting Date** (if mentioned)\n\nKeep each section under 5 bullets. Transcript:\n[paste transcript]"`,
    },
    {
      name: 'Lead Scorer',
      prompt: `"Score this sales lead from 1-10. Scoring criteria:\n- Job title relevance to [your product]: 30%\n- Company size fit ([your ideal]: [X-Y employees]): 20%\n- Expressed interest level in their message: 50%\n\nReturn JSON only: {\"score\": X, \"reasoning\": \"one sentence\", \"priority\": \"high|medium|low\"}\n\nLead: [paste lead info]"`,
    },
    {
      name: 'Content Repurposer',
      prompt: `"Transform this blog post into social content. Create:\n- 3 LinkedIn posts (each 150-200 words, thought leadership tone)\n- 5 tweets (each under 250 chars, punchy and quotable)\n- 1 Instagram caption (storytelling format, 100-150 words, 5 hashtags)\n\nMaintain the core message but adapt tone for each platform.\n\nBlog post: [paste content]"`,
    },
  ],
};

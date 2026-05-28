# Build Your First AI Agent in a Weekend
**A Step-by-Step Guide Using No-Code Tools — From Zero to Working Agent in 48 Hours**

*38 pages | 12,000 words | PDF*
*Price: $14.99*

---

## What Is an AI Agent?

An AI agent is software that perceives its environment, makes decisions, and takes actions to achieve a goal — automatically. Unlike a chatbot that just answers questions, an agent can:
- Receive a trigger (like an incoming email)
- Analyze it using AI
- Decide what action to take
- Execute that action (file it, reply, create a task)

Think of it as a smart assistant that actually *does* things, not just talks.

**Your first agent project:** We'll build an Email Intelligence Agent that reads your Gmail, classifies each email by importance, and routes it to the right folder automatically. By Sunday night, your inbox will organize itself.

**Tools you need (all free to start):**
- Gmail account
- n8n.io account (free cloud plan — sign up at n8n.io)
- OpenAI API key (sign up at platform.openai.com — $5 free credit = thousands of classifications)
- Optional: Notion account for task creation

---

## Friday Evening (2 hours): Planning & Setup

### Setup Checklist

1. Create n8n.io account at n8n.io/cloud
2. Create OpenAI account at platform.openai.com
3. Generate API key: Platform.openai.com → API Keys → Create new secret key → Copy it somewhere safe
4. Connect Gmail to n8n: In n8n, go to Credentials → New → Gmail OAuth2 → follow the Google authorization flow
5. Test connection: Create a simple workflow with a Gmail trigger — if it shows your recent emails, you're ready

**Common setup errors:**
- "Gmail OAuth failed": Make sure you're logged into the correct Google account in your browser before authorizing
- "API key not working": Check there are no spaces before/after when you paste it into n8n
- "Can't find the node": Use the search bar in n8n — type "Gmail" or "OpenAI"

---

## Saturday Morning (3 hours): Building the Trigger and Email Capture

### Step 1: Create a New Workflow in n8n

Click "New Workflow" in n8n. Name it "Email Intelligence Agent". You'll see a blank canvas — this is where you'll connect nodes (building blocks) to create your automation.

### Step 2: Add the Gmail Trigger Node

Click the "+" button → search "Gmail" → select "Gmail Trigger". Configure it:
- **Credential:** Select the Gmail account you connected
- **Event:** "Message Received"
- **Filters (optional):** Leave blank to process all emails, or add "has:attachment" to only process emails with files
- **Poll time:** Every 1 minute (for testing) → change to Every 5 minutes when live

### Step 3: Test the Trigger

Click "Test step" — n8n will fetch your most recent email and show you the data structure. You'll see fields like: id, threadId, snippet, from, subject, date, body (decoded). This is the data your AI will analyze.

**The email data structure you'll use:**
- `{{$json.from.value[0].address}}` — sender email
- `{{$json.subject}}` — email subject line
- `{{$json.text}}` — plain text body (first 500 chars is usually enough)
- `{{$json.date}}` — when it was received

### Step 4: Add a "Set" Node to Extract Key Fields

Add a Set node after Gmail Trigger. This cleans up the data:
- **sender:** `{{$json.from.value[0].address}}`
- **subject:** `{{$json.subject}}`
- **bodyPreview:** `{{$json.text.slice(0, 500)}}`
- **emailId:** `{{$json.id}}`

**Why this matters:** Sending the full email body to OpenAI wastes tokens and money. Extracting just the key fields keeps costs under $0.001 per email.

---

## Saturday Afternoon (3 hours): Adding the AI Brain

### Step 5: Add the OpenAI Node

After your Set node, add an OpenAI node. Configure:
- **Credential:** Paste your OpenAI API key
- **Resource:** "Text"
- **Operation:** "Message a Model"
- **Model:** "gpt-4o-mini" (fast + cheap — perfect for classification)

**System message (paste exactly):**
```
"You are an email triage assistant. Classify every email into exactly one category. Return ONLY the category name — nothing else, no explanation, no punctuation.

Categories:
- URGENT: requires action within 24 hours, from a real person
- ACTION: requires action but not urgent (can wait 2-3 days)
- NEWSLETTER: newsletters, marketing emails, updates from services
- RECEIPT: invoices, order confirmations, receipts
- PERSONAL: from friends or family
- SPAM: unwanted email"
```

**User message:**
```
"From: {{sender}}
Subject: {{subject}}
Preview: {{bodyPreview}}

Category:"
```

- **Max tokens:** 10 (we only need one word back)
- **Temperature:** 0 (we want consistent, not creative)

### Step 6: Test the Classification

Run the workflow with a test email. In the output, look for: the AI's response in the "text" field. It should return exactly one word like "NEWSLETTER" or "URGENT".

**Troubleshooting:**
- Got a long response instead of one word? Add to your system message: "CRITICAL: Return ONLY the category name. No other text."
- Got an error? Check your API key is correct and you have credits
- Getting wrong classifications? Your first 20 emails will be ~85% accurate. It improves as you refine the prompt.

---

## Saturday Evening (2 hours): Adding Actions & Routing

### Step 7: Add a Switch Node

After OpenAI, add a Switch node. This routes emails to different actions based on the AI's classification.

**Configure the Switch node:**
- **Mode:** "Rules"
- **Rules:**
  - Rule 1: `{{$json.text}}` equals "URGENT" → Output 1
  - Rule 2: `{{$json.text}}` equals "ACTION" → Output 2
  - Rule 3: `{{$json.text}}` equals "NEWSLETTER" → Output 3
  - Rule 4: `{{$json.text}}` equals "RECEIPT" → Output 4
  - Rule 5: Default → Output 5 (catches PERSONAL, SPAM, anything else)

### Step 8: Add Gmail Label Actions

For each Switch output, add a Gmail node:
- **Resource:** "Thread"
- **Operation:** "Add Label"
- **Thread ID:** `{{$('Gmail Trigger').item.json.threadId}}`
- **Label IDs:** Create labels in Gmail first (Settings → Labels → Create label)
  - Create labels: "AI-Urgent", "AI-Action", "AI-Newsletter", "AI-Receipt"

**Gmail label IDs:** You need to use the label's ID not its name. In n8n, when you select "Label IDs", use the dropdown — n8n fetches your Gmail labels automatically.

### Step 9: Optional — Create Notion Tasks for URGENT Emails

After the URGENT label action, add a Notion node:
- **Operation:** "Create Page"
- **Database:** Select your task database
- **Fields:** Title = `{{subject}}`, From = `{{sender}}`, Due = Today + 24h

### Step 10: Test the Full Flow

Send yourself test emails of each type. Run the workflow manually. Watch as n8n processes each email: the Gmail trigger fires, Set extracts fields, OpenAI classifies, Switch routes, Gmail applies labels. When it works, your inbox is now automated.

---

## Sunday (4 hours): Deploy, Monitor & Build Your Next Agent

### Step 11: Activate Your Agent

Click "Active" toggle in n8n to turn your workflow on. It now runs every 5 minutes automatically. Leave it running for 48 hours and check how many emails it classified. Target: 85%+ accuracy in the right category.

### Step 12: Fine-Tuning (When You See Mistakes)

If "newsletter" emails are classified as "ACTION", update your system prompt:
- Add examples: "NEWSLETTER example: 'This week's top content from [Brand]' or 'Your weekly digest is ready'"
- Add negative examples: "This is NOT URGENT: promotional emails, newsletters, auto-generated notifications"

### Step 13: Monitoring Your Agent

In n8n, go to Executions to see every time your agent ran. You'll see: which emails it processed, what classifications it made, and any errors. Check it daily for the first week.

**Cost tracking:** Each email classification costs ~0.001 USD (1 cent per 1,000 emails). Even with 500 emails/month, you'll spend under $1/month on OpenAI.

### Step 14: Your Next 5 Agents to Build

Now that you understand the pattern (Trigger → Data → AI → Action), here are 5 more agents to build:

**1. Social Media Monitor Agent**
Triggers when someone mentions your brand on Twitter → AI analyzes sentiment → Routes to Slack if negative (requires social listening tool + Slack)

**2. Content Repurposer Agent**
Trigger when new blog post published → AI creates 3 LinkedIn posts + 5 tweets + 1 email newsletter section → Saves to Notion draft folder

**3. Lead Scorer Agent**
Trigger on new CRM entry → AI scores lead 1-10 based on role/company/message → Tags high-value leads for immediate follow-up

**4. Invoice Tracker Agent**
Trigger on new receipt/invoice email → AI extracts amount/vendor/date → Creates row in Google Sheets financial tracker

**5. Customer FAQ Auto-Responder**
Trigger on new support email → AI checks if it matches one of 20 FAQ answers → Drafts reply for human review → One-click send

---

## Bonus: Prompt Templates for Your Agent Library

### Email Classification (Used in Tutorial)
```
System: "You are an email triage assistant. Classify every email into exactly one category. Return ONLY the category name.

Categories: URGENT (action needed in 24h), ACTION (action needed, not urgent), NEWSLETTER, RECEIPT, PERSONAL, SPAM"

User: "From: [sender]
Subject: [subject]
Preview: [first 500 chars of body]

Category:"
```

### Meeting Notes Summarizer
```
"Summarize this meeting transcript in exactly this format:

**Decisions Made** (bullet list)
**Action Items** (bullet list with owner name)
**Open Questions** (bullet list)
**Next Meeting Date** (if mentioned)

Keep each section under 5 bullets. Transcript:
[paste transcript]"
```

### Lead Scorer
```
"Score this sales lead from 1-10. Scoring criteria:
- Job title relevance to [your product]: 30%
- Company size fit ([your ideal]: [X-Y employees]): 20%
- Expressed interest level in their message: 50%

Return JSON only: {"score": X, "reasoning": "one sentence", "priority": "high|medium|low"}

Lead: [paste lead info]"
```

### Content Repurposer
```
"Transform this blog post into social content. Create:
- 3 LinkedIn posts (each 150-200 words, thought leadership tone)
- 5 tweets (each under 250 chars, punchy and quotable)
- 1 Instagram caption (storytelling format, 100-150 words, 5 hashtags)

Maintain the core message but adapt tone for each platform.

Blog post: [paste content]"
```

---

## Quick Reference: The Agent Pattern

Every AI agent you'll ever build follows this same 4-step pattern:

1. **TRIGGER** — Something happens (email arrives, form submitted, file uploaded, schedule reached)
2. **DATA** — Extract the relevant information from the trigger
3. **AI TRANSFORM** — Send data to an AI model with specific instructions
4. **ACTION** — Use the AI output to do something meaningful

Master this pattern and you can build any agent. The tools change (Zapier vs. n8n vs. Make.com), the AI models evolve (GPT-4 vs. Claude vs. Gemini), but the pattern is universal and permanent.

Your Email Intelligence Agent isn't just a useful tool — it's your proof of concept. You now know the pattern that powers every enterprise AI automation, from Netflix recommendations to Amazon's logistics. You built yours in a weekend.

---

*© Ruflo Digital Products. For personal and professional use.*

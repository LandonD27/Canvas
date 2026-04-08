# Cloudflare Worker Setup — Canvas AI Helper

This relay lets you use the AI sidebar on Canvas through a VPN.
Your iPad talks to the Worker; the Worker calls Claude.
Free Cloudflare account is all you need.

---

## Step 1 — Create a Cloudflare account

1. Go to **cloudflare.com** in Safari
2. Tap **Sign Up** — use any email
3. Verify your email

---

## Step 2 — Create the Worker

1. After logging in, tap **Workers & Pages** in the left sidebar
2. Tap **Create** → **Create Worker**
3. Give it any name, e.g. `canvas-ai`
4. Tap **Deploy** (ignore the default code for now)
5. Tap **Edit code**
6. Delete all the existing code
7. Paste the entire contents of `worker.js` (this folder)
8. Tap **Deploy**

---

## Step 3 — Add your API key as a secret

1. Go back to your Worker's main page
2. Tap **Settings** → **Variables and Secrets**
3. Tap **Add** under **Secrets**
4. Name: `ANTHROPIC_API_KEY`
5. Value: paste your `sk-ant-...` key
6. Tap **Deploy**

---

## Step 4 — Get your Worker URL

On the Worker's main page you'll see a URL like:
```
https://canvas-ai.yourname.workers.dev
```
Copy that URL.

---

## Step 5 — Install the bookmarklet

1. Open `safari-bookmarklet-worker.js`
2. Replace `https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev` with your actual Worker URL from Step 4
3. Follow the same bookmarklet install steps:
   - Bookmark any page in Safari, name it **Ask Canvas AI**
   - Edit the bookmark → replace the URL with the full contents of the updated bookmarklet file

---

## How to use it

1. Open Canvas in **Safari** and navigate to any assignment
2. Tap the **Ask Canvas AI** bookmark
3. A sidebar appears inside the page — never leaves Canvas
4. Tap **Extract** to auto-grab the question, or paste manually
5. Tap **Ask Claude** — answer appears in the sidebar

The VPN does not affect this because your iPad only talks to `workers.dev`,
which is a normal website. The Worker handles the Anthropic API call from
Cloudflare's servers.

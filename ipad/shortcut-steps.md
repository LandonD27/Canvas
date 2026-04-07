# Canvas AI Helper — iPad Setup

Two options depending on how you access Canvas:

---

## Option A: Apple Shortcut (works with the Canvas app)

### Step 1 — Create the Shortcut

Open the **Shortcuts** app → tap **+** (top right) → tap the title and rename it **"Ask Canvas AI"**.

Add these actions in order:

---

**Action 1: Receive Input**
- Search for: `Receive`
- Choose: **Receive [Text] from [Share Sheet and Quick Actions]**
- Set "If there's no input" → **Ask for Input** (this lets you paste or type manually too)

---

**Action 2: Set Variable**
- Search for: `Set Variable`
- Variable Name: `question`
- Value: tap the variable pill → select **Shortcut Input**

---

**Action 3: Set Variable** (store your API key)
- Add another **Set Variable**
- Variable Name: `apiKey`
- Value: `sk-ant-YOUR-KEY-HERE`  ← paste your actual Anthropic API key here

---

**Action 4: Get Contents of URL**
- Search for: `Get Contents of URL`
- URL: `https://api.anthropic.com/v1/messages`
- Method: **POST**
- Headers (tap Add new header for each):
  - `x-api-key` → tap the variable pill → choose **apiKey**
  - `anthropic-version` → `2023-06-01`
  - `content-type` → `application/json`
- Request Body: **JSON**
  - Tap "Add new field" → Text → key: `model`, value: `claude-sonnet-4-6`
  - Add field → Number → key: `max_tokens`, value: `1024`
  - Add field → Array → key: `messages`
    - Inside messages, add a Dictionary:
      - `role` → `user`
      - `content` → tap variable pill → choose **question**

---

**Action 5: Get Dictionary Value**
- Search for: `Get Dictionary Value`
- Get: **Value** for key: `content`
- From: **Contents of URL** (tap variable pill)

---

**Action 6: Get Item from List**
- Search for: `Get Item from List`
- Get: **First Item**
- From: the result of step 5

---

**Action 7: Get Dictionary Value**
- Get: **Value** for key: `text`
- From: the result of step 6

---

**Action 8: Show Result** (or Quick Look)
- Search for: `Show Result`
- Input: the result of step 7

---

### Step 2 — Add to Home Screen (optional but handy)
- In the shortcut editor, tap the **settings icon** (top right)
- Tap **Add to Home Screen**
- Now it's one tap away

### Step 3 — Use it from the Canvas app
1. In Canvas app, long-press on assignment text → **Select All** → **Copy**
2. Open Shortcuts app → tap **Ask Canvas AI**
   - It will ask "Provide input" — tap **Clipboard** to use what you copied
3. The answer appears on screen

**Or use the Share Sheet:**
1. Tap the Share icon anywhere in Canvas
2. Scroll down in the share sheet → tap **Ask Canvas AI**
3. It uses the current page's shared text automatically

---

## Option B: Safari Bookmarklet (works when using Canvas in Safari)

If you open Canvas in **Safari** instead of the app, you can use a bookmarklet that injects the same sidebar as the Chrome extension.

### Setup
1. In Safari, bookmark any page (e.g. google.com) — name it **"Ask Canvas AI"**
2. Go to **Bookmarks → Edit** → find that bookmark
3. Replace the URL with the entire contents of `safari-bookmarklet.js` (see that file)

### Use
- Open any Canvas assignment in Safari
- Tap the bookmark → the AI sidebar appears

---

## Getting an Anthropic API Key
1. Go to https://console.anthropic.com/settings/api-keys
2. Click **Create Key**
3. Copy it (starts with `sk-ant-`)
4. Paste it into the shortcut's `apiKey` variable (Option A) or the bookmarklet prompt (Option B)

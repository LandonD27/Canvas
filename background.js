// Canvas Assignment Helper - Background Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_CLAUDE") {
    handleClaudeRequest(message.question).then(sendResponse);
    return true; // keep channel open for async response
  }
});

async function handleClaudeRequest(question) {
  try {
    const { apiKey } = await chrome.storage.sync.get("apiKey");
    if (!apiKey) {
      return {
        error:
          'No API key set. Click the extension icon and go to Options to add your Anthropic API key.',
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a helpful academic assistant. Answer the following assignment question clearly and concisely. Show your reasoning where relevant.\n\n${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        error: `API error ${response.status}: ${err?.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text ?? "No response received.";
    return { answer };
  } catch (err) {
    return { error: err.message };
  }
}

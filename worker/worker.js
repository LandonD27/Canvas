// Cloudflare Worker — Canvas AI Relay
// Sits between the Safari bookmarklet and the Anthropic API.
// Deploy this at Cloudflare Workers (free tier).
// Set ANTHROPIC_API_KEY as a secret environment variable in the Worker settings.

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(null, 204);
    }

    if (request.method !== 'POST') {
      return cors(JSON.stringify({ error: 'POST requests only' }), 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return cors(JSON.stringify({ error: 'Invalid JSON body' }), 400);
    }

    const question = body.question;
    if (!question || !question.trim()) {
      return cors(JSON.stringify({ error: 'No question provided' }), 400);
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return cors(JSON.stringify({ error: 'API key not set in Worker environment' }), 500);
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: 'You are a helpful academic assistant. Answer the following clearly and show your reasoning.\n\n' + question.trim()
        }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return cors(JSON.stringify({
        error: data?.error?.message || `Anthropic error ${upstream.status}`
      }), 502);
    }

    const answer = data.content?.[0]?.text ?? 'No response received.';
    return cors(JSON.stringify({ answer }), 200);
  }
};

function cors(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

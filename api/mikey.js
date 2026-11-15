module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array is required' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key missing' });

  const systemPrompt = `You are Mikey, a friendly Python tutor. Your ONLY job is to answer questions about Python programming. 
RULES:
1. If unrelated to Python, reply ONLY: "I can only answer Python questions. Ask me about Python!"
2. Keep explanations short (2-3 sentences).
3. ALWAYS wrap Python code in markdown triple backticks (\`\`\`python ... \`\`\`).
4. Use proper indentation and line breaks.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.5,
        max_tokens: 350
      })
    });

    if (!response.ok) throw new Error(`Groq API returned ${response.status}`);
    const data = await response.json();
    return res.status(200).json({ reply: data.choices[0].message.content.trim() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed', details: error.message });
  }
};

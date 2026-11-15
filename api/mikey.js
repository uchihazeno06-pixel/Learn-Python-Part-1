module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key is not configured', details: 'GROQ_API_KEY is missing in Vercel settings.' });
  }

  const systemPrompt = `You are Mikey, a friendly Python tutor. Your ONLY job is to answer questions about Python programming. 
RULES:
1. If the user asks about anything unrelated to Python, reply ONLY with: "I can only answer Python questions. Ask me about Python!"
2. Keep your explanations short and conversational (max 2-3 sentences).
3. CRITICAL: Whenever you provide Python code, you MUST wrap it in markdown triple backticks with the word python. Example:
\`\`\`python
print("Hello")
\`\`\`
4. Never provide code as a single continuous line. Always use proper indentation and line breaks inside the code block.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.5,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    return res.status(200).json({ reply: reply });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to get response from Mikey', 
      details: error.message 
    });
  }
};

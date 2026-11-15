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
1. If the user asks about anything unrelated to Python (e.g., cooking, politics, general knowledge), reply ONLY with: "I can only answer Python questions. Ask me about Python!"
2. Keep your answers clear and conversational, like a human tutor. You can use up to 3-4 short sentences or a brief bulleted list if needed, but avoid huge walls of text.
3. Be direct. Don't over-explain unless the user asks for a deep dive.
4. If the user asks for code, provide a clean, working snippet and a 1-sentence explanation of how it works.`;

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
      console.error("Groq Error Status:", response.status);
      console.error("Groq Error Details:", errorText);
      throw new Error(`Groq API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    return res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("Mikey Catch Error:", error.message);
    return res.status(500).json({ 
      error: 'Failed to get response from Mikey', 
      details: error.message 
    });
  }
};

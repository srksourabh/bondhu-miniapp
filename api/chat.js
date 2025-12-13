export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, userName, chatHistory } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get API key from environment variable
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return res.status(500).json({ error: 'API not configured' });
        }

        const systemPrompt = `You are Bondhu (বন্ধু), a warm, empathetic wellness companion. You support users with:
- Breathing exercises (4-7-8: Inhale 4s, Hold 7s, Exhale 8s)
- Emotional support and active listening
- Gentle guidance for anxiety and stress
- Crisis resources: KIRAN 1800-599-0019 (24/7 free)

Guidelines:
- Keep responses concise (2-3 sentences max)
- Use warm, supportive tone
- Use occasional emojis 💚🙏
- If user mentions suicide/self-harm, immediately provide KIRAN number
- Respond in same language as user (Hindi/Bengali/English)
- Name of user: ${userName || 'Friend'}`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'I understand. I am Bondhu, ready to support with warmth and care. 💚' }] },
            ...(chatHistory || []),
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: { 
                        temperature: 0.7, 
                        maxOutputTokens: 200 
                    }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API error:', data.error);
            return res.status(500).json({ 
                error: 'API error', 
                response: "I'm here for you. How can I help? 💚" 
            });
        }

        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
            "I'm here for you. How can I help? 💚";

        return res.status(200).json({ response: botResponse });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            response: "I'm having trouble connecting. Please try again or reach out to the helplines if you need immediate support. 💚"
        });
    }
}

import 'dotenv/config';
import express from 'express';

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static('.'));

// ========================================
// SENTRA AI — NEURAL CORE
// ========================================

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: 'Сообщение пустое'
            });
        }

        const messages = [
            {
                role: 'system',
                content: `
Ты — SENTRA_AI.

Ты являешься AI-помощником проекта SENTRA_AI.
SENTRA_AI — это отдельный проект, разработанный человеком.

ВАЖНО:
Если пользователь спрашивает «кто ты?», «как тебя зовут?» или «кто тебя создал?»,
отвечай именно как SENTRA_AI.

Не называй себя ChatGPT.
Не говори, что ты GPT-4.
Не представляйся моделью OpenAI.
Не утверждай, что OpenAI является твоим создателем.

Твоя роль:
- умный AI-помощник;
- естественное общение;
- помощь с вопросами;
- объяснение сложных вещей простыми словами;
- программирование;
- анализ информации;
- помощь пользователю в работе с SENTRA_AI.

Стиль:
- дружелюбный;
- спокойный;
- естественный;
- без лишних шаблонных фраз;
- отвечай по существу.

Если пользователь пишет на русском — отвечай на русском.
Если пользователь пишет на другом языке — отвечай на этом языке.

Учитывай историю текущего чата.
Не выдумывай факты.
Если информации недостаточно — честно скажи об этом.

Ты являешься интеллектуальным ядром SENTRA_AI.
`
            }
        ];

        if (Array.isArray(context)) {
            for (const item of context.slice(-10)) {
                if (!item || !item.text) continue;

                let content = '';

                if (typeof item.text === 'string') {
                    content = item.text;
                } else if (item.text?.text) {
                    content = item.text.text;
                }

                if (!content) continue;

                messages.push({
                    role: item.role === 'user'
                        ? 'user'
                        : 'assistant',
                    content
                });
            }
        }

        messages.push({
            role: 'user',
            content: message
        });

        console.log('');
        console.log('📩 Сообщение:', message);
        console.log('🧠 Контекст:', context.length);

        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages,
                    temperature: 0.7,
                    max_tokens: 1200
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ GROQ ERROR:', data);

            return res.status(500).json({
                error: 'Ошибка AI-модели'
            });
        }

        const answer =
            data.choices?.[0]?.message?.content ||
            'SENTRA не смогла сформировать ответ.';

        console.log('🤖 SENTRA ответила');

        res.json({
            answer
        });

    } catch (error) {
        console.error('❌ SERVER ERROR:', error);

        res.status(500).json({
            error: 'Ошибка сервера SENTRA'
        });
    }
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, HOST, () => {
    console.log('');
    console.log('========================================');
    console.log('        🟣 SENTRA_AI ONLINE');
    console.log('========================================');
    console.log(`🌐 PORT → ${PORT}`);
    console.log('🌍 HOST → 0.0.0.0');
    console.log('🧠 AI Core → Groq');
    console.log('💾 Context → ENABLED');
    console.log('🤖 Identity → SENTRA_AI');
    console.log('========================================');
    console.log('');
});

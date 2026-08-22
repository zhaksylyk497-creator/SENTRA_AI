import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));

app.use(express.static(process.cwd()));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/SENTRA_AI.HTML");
});

app.get("/health", (req, res) => {
    res.json({
        status: "online",
        name: "SENTRA_AI",
        ai: "Groq",
        vision: true
    });
});

app.post("/api/chat", async (req, res) => {
    try {
        const {
            message = "",
            context = [],
            memoryContext = "",
            imageData = null
        } = req.body;

        if ((!message || !message.trim()) && !imageData) {
            return res.status(400).json({
                error: "Сообщение пустое"
            });
        }

        const messages = [
            {
                role: "system",
                content: `
Ты — SENTRA_AI.

Ты являешься AI-помощником проекта SENTRA_AI.

Отвечай естественно, понятно и по существу.

ЯЗЫК ОТВЕТА:
- Всегда отвечай на языке вопроса пользователя.
- Если пользователь пишет на русском — отвечай на русском.
- Если пользователь пишет на казахском — отвечай на казахском.
- Если пользователь пишет на английском — отвечай на английском.
- Язык текста на изображении НЕ определяет язык ответа.
- Не переходи на английский только потому, что изображение содержит английский текст.

VISION:
Если пользователь отправил изображение:
- внимательно анализируй изображение;
- отвечай именно на вопрос пользователя;
- если вопрос не задан, опиши изображение;
- если на изображении есть текст, можешь его прочитать;
- не выдумывай то, чего невозможно определить.

Не выдумывай факты.
Учитывай контекст разговора.

Ты — интеллектуальное ядро SENTRA_AI.
`
            }
        ];

        // Контекст разговора
        if (Array.isArray(context)) {
            for (const item of context.slice(-10)) {
                if (!item || !item.text) continue;

                messages.push({
                    role: item.role === "user" ? "user" : "assistant",
                    content: String(item.text)
                });
            }
        }

        // Память
        if (memoryContext) {
            messages.push({
                role: "system",
                content:
                    "Дополнительная информация из памяти:\n" +
                    memoryContext
            });
        }

        // Обычный текст
        if (!imageData) {
            messages.push({
                role: "user",
                content: message
            });
        }

        // Vision
        if (imageData) {
            if (
                typeof imageData !== "string" ||
                !imageData.startsWith("data:image/")
            ) {
                return res.status(400).json({
                    error: "Неверный формат изображения"
                });
            }

            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text:
                            message.trim() ||
                            "Опиши это изображение."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageData
                        }
                    }
                ]
            });
        }

        const model = imageData
            ? "qwen/qwen3.6-27b"
            : "openai/gpt-oss-20b";

        console.log("SENTRA request");
        console.log("Model:", model);
        console.log("Vision:", !!imageData);

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1200
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ ERROR:", data);

            return res.status(500).json({
                error:
                    data?.error?.message ||
                    "Ошибка Groq"
            });
        }

        const answer =
            data?.choices?.[0]?.message?.content ||
            "SENTRA не смогла сформировать ответ.";

        console.log("SENTRA answer received");

        return res.json({
            answer: answer
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);

        return res.status(500).json({
            error: "Ошибка сервера SENTRA"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("================================");
    console.log("       SENTRA_AI ONLINE");
    console.log("================================");
    console.log("PORT:", PORT);
    console.log("TEXT: openai/gpt-oss-20b");
    console.log("VISION: qwen/qwen3.6-27b");
    console.log("================================");
});

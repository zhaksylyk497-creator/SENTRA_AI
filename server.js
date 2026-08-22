import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;

// Увеличиваем лимит, потому что изображение передаётся в Base64
app.use(express.json({ limit: "30mb" }));

// Раздаём сайт
app.use(express.static(process.cwd()));

// Главная страница
app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/SENTRA_AI.HTML");
});

// Проверка сервера
app.get("/health", (req, res) => {
    res.json({
        status: "online",
        name: "SENTRA_AI",
        ai: "Groq",
        vision: "Qwen 3.6 27B"
    });
});

// ========================================
// SENTRA AI — API
// ========================================

app.post("/api/chat", async (req, res) => {
    try {
        const {
            message = "",
            context = [],
            memoryContext = "",
            imageData = null
        } = req.body;

        // Должно быть либо сообщение, либо изображение
        if ((!message || !message.trim()) && !imageData) {
            return res.status(400).json({
                error: "Сообщение или изображение отсутствует"
            });
        }

        const messages = [
            {
                role: "system",
                content: `
Ты — SENTRA_AI.

Ты являешься AI-помощником проекта SENTRA_AI.

Отвечай естественно, понятно и по существу.

Если пользователь пишет на русском — отвечай на русском.
Если пользователь пишет на другом языке — отвечай на этом языке.

Не выдумывай факты.
Учитывай контекст текущего разговора.

Если пользователь отправил изображение:
- внимательно проанализируй его;
- отвечай именно на вопрос пользователя об изображении;
- если вопрос не задан, кратко опиши, что находится на изображении;
- если на изображении есть текст, можешь его прочитать;
- не утверждай то, чего невозможно уверенно определить.

Ты являешься интеллектуальным ядром SENTRA_AI.
`
            }
        ];

        // ========================================
        // КОНТЕКСТ ЧАТА
        // ========================================

        if (Array.isArray(context)) {
            for (const item of context.slice(-10)) {

                if (!item || !item.text) continue;

                let content = "";

                if (typeof item.text === "string") {
                    content = item.text;
                } else if (item.text?.text) {
                    content = item.text.text;
                }

                if (!content) continue;

                messages.push({
                    role: item.role === "user"
                        ? "user"
                        : "assistant",
                    content
                });
            }
        }

        // ========================================
        // ПАМЯТЬ
        // ========================================

        if (memoryContext) {
            messages.push({
                role: "system",
                content: `Дополнительная информация из памяти:\n${memoryContext}`
            });
        }

        // ========================================
        // VISION
        // ========================================

        if (imageData) {

            // Проверяем, что это Data URL изображения
            if (
                typeof imageData !== "string" ||
                !imageData.startsWith("data:image/")
            ) {
                return res.status(400).json({
                    error: "Неверный формат изображения"
                });
            }

            // Проверяем размер Base64-данных
            const approxBytes =
                Math.floor((imageData.length * 3) / 4);

            if (approxBytes > 20 * 1024 * 1024) {
                return res.status(413).json({
                    error: "Изображение слишком большое. Максимум 20 МБ."
                });
            }

            messages.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: message.trim() ||
                            "Что изображено на этой фотографии? Опиши подробно."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageData
                        }
                    }
                ]
            });

        } else {

            // ========================================
            // ОБЫЧНЫЙ ТЕКСТОВЫЙ ЧАТ
            // ========================================

            messages.push({
                role: "user",
                content: message
            });
        }

        console.log(
            imageData
                ? "🖼️ SENTRA получила изображение"
                : "📩 Сообщение:",
            message || "(без текста)"
        );

        // ========================================
        // ВЫБОР МОДЕЛИ
        // ========================================

        const model = imageData
            ? "qwen/qwen3.6-27b"
            : "openai/gpt-oss-20b";

        console.log("🧠 Модель:", model);

        // ========================================
        // ЗАПРОС GROQ
        // ========================================

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
                    model,
                    messages,
                    temperature: imageData ? 0.7 : 0.7,
                    max_completion_tokens: 1200
                })
            }
        );

        const data = await response.json();

        // ========================================
        // ОШИБКА GROQ
        // ========================================

        if (!response.ok) {

            console.error("❌ GROQ ERROR:", data);

            return res.status(response.status).json({
                error:
                    data.error?.message ||
                    "Ошибка Groq"
            });
        }

        // ========================================
        // ОТВЕТ
        // ========================================

        const answer =
            data.choices?.[0]?.message?.content ||
            "SENTRA не смогла сформировать ответ.";

        console.log("🤖 SENTRA ответила");

        res.json({
            answer
        });

    } catch (error) {

        console.error("❌ SERVER ERROR:", error);

        res.status(500).json({
            error: "Ошибка сервера SENTRA"
        });
    }
});

// ========================================
// START
// ========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("========================================");
    console.log("        🟣 SENTRA_AI ONLINE");
    console.log("========================================");
    console.log(`🌐 PORT → ${PORT}`);
    console.log("🌍 HOST → 0.0.0.0");
    console.log("🧠 TEXT → GPT OSS 20B");
    console.log("👁️ VISION → Qwen 3.6 27B");
    console.log("💾 Context → ENABLED");
    console.log("🤖 Identity → SENTRA_AI");
    console.log("========================================");
    console.log("");
});

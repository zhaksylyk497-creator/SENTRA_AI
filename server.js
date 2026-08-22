import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

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
        ai: "Groq"
    });
});

// ========================================
// SENTRA AI — API
// ========================================

app.post("/api/chat", async (req, res) => {
    try {
        const {
            message,
            context = [],
            memoryContext = ""
        } = req.body;

        if (!message || !message.trim()) {
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

Если пользователь пишет на русском — отвечай на русском.
Если пользователь пишет на другом языке — отвечай на этом языке.

Не выдумывай факты.
Учитывай контекст текущего разговора.

Ты являешься интеллектуальным ядром SENTRA_AI.
`
            }
        ];

        // Контекст текущего чата
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

        // Память
        if (memoryContext) {
            messages.push({
                role: "system",
                content: `Дополнительная информация из памяти:\n${memoryContext}`
            });
        }

        // Текущее сообщение
        messages.push({
            role: "user",
            content: message
        });

        console.log("📩 Сообщение:", message);

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1200
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ GROQ ERROR:", data);

            return res.status(500).json({
                error: data.error?.message || "Ошибка Groq"
            });
        }

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
    console.log("🧠 AI Core → Groq");
    console.log("💾 Context → ENABLED");
    console.log("🤖 Identity → SENTRA_AI");
    console.log("========================================");
    console.log("");
});

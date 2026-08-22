import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(express.json({ limit: "2mb" }));

// Раздаём файлы из корня проекта
app.use(express.static(process.cwd()));

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/SENTRA_AI.HTML");
});

// Проверка сервера
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    ai: "Groq",
    name: "SENTRA_AI"
  });
});

// AI
app.post("/api/chat", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY не настроен"
      });
    }

    const messages = req.body.messages || [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return res.status(response.status).json({
        error: data.error?.message || "Ошибка Groq API"
      });
    }

    res.json(data);

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Ошибка сервера",
      details: error.message
    });
  }
});

// Запуск
app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("🟣 SENTRA_AI ONLINE");
  console.log(`🌐 PORT → ${PORT}`);
  console.log("🌍 HOST → 0.0.0.0");
  console.log("🧠 AI Core → Groq");
  console.log("📄 HTML → SENTRA_AI.HTML");
  console.log("================================");
});

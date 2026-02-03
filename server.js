import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_URL = "https://api.ollama.ai/v1/chat/completions";

// 🧠 memoria chat (semplice, limitata)
let chatHistory = [];
const MAX_MESSAGES = 10;

// 🔹 ASK
app.post("/ask", async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ error: "Parametri mancanti" });
  }

  chatHistory.push({ role: "user", content: question });
  if (chatHistory.length > MAX_MESSAGES * 2) {
    chatHistory = chatHistory.slice(-MAX_MESSAGES * 2);
  }

  try {
    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: chatHistory,
        temperature: 0.7
      })
    });

    const data = await ollamaRes.json();

    const answer =
      data.choices?.[0]?.message?.content ?? "Nessuna risposta dal modello";

    chatHistory.push({ role: "assistant", content: answer });

    res.json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore Ollama Cloud" });
  }
});

// 🔹 RESET
app.post("/reset", (req, res) => {
  chatHistory = [];
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Ollama proxy attivo su porta", PORT);
});

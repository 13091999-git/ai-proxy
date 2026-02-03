import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_URL = "https://api.ollama.ai/v1/chat/completions";

let chatHistory = [];
const MAX_MESSAGES = 10;

app.post("/ask", async (req, res) => {
  try {
    const { question, model } = req.body;

    if (!OLLAMA_API_KEY) {
      return res.status(500).json({ error: "API key Ollama mancante" });
    }

    if (!question || !model) {
      return res.status(400).json({ error: "Parametri mancanti" });
    }

    chatHistory.push({ role: "user", content: question });
    chatHistory = chatHistory.slice(-MAX_MESSAGES * 2);

    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: chatHistory
      })
    });

    const rawText = await ollamaRes.text();

    // 🔎 LOG CRITICO
    console.log("OLLAMA STATUS:", ollamaRes.status);
    console.log("OLLAMA RAW RESPONSE:", rawText);

    if (!ollamaRes.ok) {
      return res.status(500).json({
        error: "Errore Ollama Cloud",
        details: rawText
      });
    }

    const data = JSON.parse(rawText);

    const answer =
      data.choices?.[0]?.message?.content ??
      "Il modello non ha restituito testo";

    chatHistory.push({ role: "assistant", content: answer });

    res.json({ answer });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Errore interno server" });
  }
});

app.post("/reset", (req, res) => {
  chatHistory = [];
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server Ollama attivo su porta", PORT);
});

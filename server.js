import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Memoria della conversazione
let conversation = [
  { role: "system", content: "Sei un assistente AI chiaro, diretto e tecnico." }
];

const MAX_MESSAGES = 20;

function trimMemory() {
  if (conversation.length > MAX_MESSAGES) {
    conversation = [
      conversation[0],
      ...conversation.slice(-MAX_MESSAGES + 1)
    ];
  }
}

app.post("/ask", async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ error: "Parametri mancanti" });
  }

  conversation.push({ role: "user", content: question });
  trimMemory();

  try {
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: conversation,
          max_tokens: 800,
          stream: false
        })
      }
    );

    const data = await hfResponse.json();

    // Se Hugging Face restituisce un errore (es. 401, 429, 503)
    if (data.error) {
      console.error("HF Error:", data.error);
      return res.status(500).json({ error: `Hugging Face: ${data.error}` });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ error: "Risposta vuota dal modello." });
    }

    conversation.push({ role: "assistant", content: answer });
    trimMemory();

    res.json({ answer });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

app.post("/reset", (req, res) => {
  conversation = [
    { role: "system", content: "Sei un assistente AI chiaro, diretto e tecnico." }
  ];
  res.json({ status: "Chat resettata" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo su porta ${PORT}`));

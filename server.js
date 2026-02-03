import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let conversation = [
  { role: "system", content: "Sei un assistente AI professionale e tecnico." }
];

const MAX_MESSAGES = 15;

function trimMemory() {
  if (conversation.length > MAX_MESSAGES) {
    conversation = [conversation[0], ...conversation.slice(-MAX_MESSAGES + 1)];
  }
}

app.post("/ask", async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  conversation.push({ role: "user", content: question });
  trimMemory();

  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: conversation,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const answer = data.choices?.[0]?.message?.content || "Nessun output dal modello.";

    conversation.push({ role: "assistant", content: answer });
    trimMemory();

    res.json({ answer });

  } catch (err) {
    res.status(500).json({ error: "Errore di connessione a Together AI" });
  }
});

app.post("/reset", (req, res) => {
  conversation = [{ role: "system", content: "Sei un assistente AI professionale e tecnico." }];
  res.json({ status: "Chat resettata" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Cloud Ollama attivo su porta ${PORT}`));

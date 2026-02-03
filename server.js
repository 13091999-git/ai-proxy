import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let conversation = [
  { role: "system", content: "Sei un assistente AI gestito tramite Ollama." }
];

const MAX_MESSAGES = 15;

app.post("/ask", async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  conversation.push({ role: "user", content: question });

  try {
    // Ollama usa /api/chat per mantenere il contesto dei messaggi
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Molti provider Ollama Cloud usano Authorization, se il tuo è locale lascialo o ignoralo
        "Authorization": `Bearer ${process.env.OLLAMA_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: model,
        messages: conversation,
        stream: false // Disabilitiamo lo streaming per semplicità
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Ollama restituisce la risposta in data.message.content
    const answer = data.message?.content || "Nessuna risposta ricevuta.";

    conversation.push({ role: "assistant", content: answer });

    // Trim memoria
    if (conversation.length > MAX_MESSAGES) {
      conversation = [conversation[0], ...conversation.slice(-MAX_MESSAGES)];
    }

    res.json({ answer });

  } catch (err) {
    console.error("Ollama Error:", err);
    res.status(500).json({ error: "Errore di connessione a Ollama: " + err.message });
  }
});

app.post("/reset", (req, res) => {
  conversation = [{ role: "system", content: "Sei un assistente AI gestito tramite Ollama." }];
  res.json({ status: "Chat resettata" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Ollama Cloud attivo"));

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   MEMORIA CONVERSAZIONE
   ========================= */

let conversation = [
  {
    role: "system",
    content: "Sei un assistente AI chiaro, diretto e tecnico."
  }
];

const MAX_MESSAGES = 20; // limite memoria

function trimMemory() {
  // mantiene system + ultimi messaggi
  if (conversation.length > MAX_MESSAGES) {
    conversation = [
      conversation[0],
      ...conversation.slice(-MAX_MESSAGES + 1)
    ];
  }
}

/* =========================
   ENDPOINT CHAT
   ========================= */

app.post("/ask", async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ error: "Parametri mancanti" });
  }

  // aggiunge domanda
  conversation.push({
    role: "user",
    content: question
  });

  trimMemory();

  try {
    const hfResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: conversation,
          max_tokens: 500
        })
      }
    );

    const data = await hfResponse.json();

    const answer =
      data?.choices?.[0]?.message?.content ??
      "Modello non ha restituito testo.";

    // salva risposta
    conversation.push({
      role: "assistant",
      content: answer
    });

    trimMemory();

    res.json({ answer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   RESET CHAT
   ========================= */

app.post("/reset", (req, res) => {
  conversation = [
    {
      role: "system",
      content: "Sei un assistente AI chiaro, diretto e tecnico."
    }
  ];
  res.json({ status: "Chat resettata" });
});

/* =========================
   AVVIO SERVER
   ========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo sulla porta", PORT);
});

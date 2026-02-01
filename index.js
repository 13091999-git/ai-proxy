import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// test base
app.get("/", (req, res) => {
  res.send("AI proxy attivo su Render");
});

// POST /ask
app.post("/ask", async (req, res) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt || !model) {
      return res.status(400).json({ error: "prompt e model obbligatori" });
    }

    // costruisce la richiesta per Hugging Face Router
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
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ]
        })
      }
    );

    // parse JSON della risposta
    const data = await hfResponse.json();

    // estrai il testo della risposta
    const text = data?.choices?.[0]?.message?.content;

    if (text === undefined) {
      return res.json({ text: "Modello non ha dato output testuale" });
    }
    return res.json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server avviato"));

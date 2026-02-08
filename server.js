require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Abilita CORS
app.use(cors());
app.use(express.json());

// Endpoint per la chat
app.post('/api/chat', async (req, res) => {
    try {
        const messagesHistory = req.body.messages;
        // Legge il modello selezionato, se non c'è usa quello di default
        const selectedModel = req.body.model || "z-ai/glm-4.5-air:free";

        if (!messagesHistory || !Array.isArray(messagesHistory)) {
            return res.status(400).json({ error: 'Formato cronologia non valido' });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.SITE_URL,
                "X-Title": process.env.SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": selectedModel, // Usa il modello inviato dal frontend
                "messages": messagesHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Errore API OpenRouter');
        }

        const data = await response.json();
        
        res.json({ 
            reply: data.choices[0].message.content 
        });

    } catch (error) {
        console.error('Errore server:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Abilita CORS per permettere al tuo frontend statico di fare richieste
app.use(cors());

// 2. Middleware per parsare il JSON
app.use(express.json());

// 3. Endpoint per la chat
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: 'Messaggio richiesto' });
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
                "model": "openai/gpt-3.5-turbo", // O qualsiasi modello gratuito/pagato su OpenRouter, es. "mistralai/mistral-7b-instruct:free"
                "messages": [
                    {
                        "role": "user",
                        "content": userMessage
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Errore API OpenRouter');
        }

        const data = await response.json();
        
        // Restituisce solo il contenuto del messaggio al frontend
        res.json({ 
            reply: data.choices[0].message.content 
        });

    } catch (error) {
        console.error('Errore server:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});

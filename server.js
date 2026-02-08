require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Abilita CORS per permettere al tuo frontend statico di fare richieste
app.use(cors());

// 2. Middleware per parsare il JSON
app.use(express.json());

// 3. Endpoint per la chat con supporto memoria
app.post('/api/chat', async (req, res) => {
    try {
        // Riceviamo l'intera cronologia (array di oggetti) dal frontend
        const messagesHistory = req.body.messages;

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
                "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
                // Passiamo direttamente la cronologia completa all'API
                "messages": messagesHistory 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Errore API OpenRouter');
        }

        const data = await response.json();
        
        // Restituiamo solo l'ultima risposta generata
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

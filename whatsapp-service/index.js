const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// Initialize WhatsApp Client with local authentication (saves session)
const client = new Client({
    authStrategy: new LocalAuth()
});

let isClientReady = false;

client.on('qr', (qr) => {
    // Generates a QR code in the terminal
    qrcode.generate(qr, { small: true });
    console.log('SCAN THE QR CODE ABOVE TO AUTHENTICATE WHATSAPP');
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isClientReady = true;
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client disconnected:', reason);
    isClientReady = false;
});

client.initialize();

// API endpoint to send a message
// Example Body: { "number": "5511999999999", "message": "Olá do Sistema!" }
app.post('/api/send', async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ error: 'WhatsApp client is not ready yet.' });
    }

    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ error: 'Missing number or message in body.' });
    }

    try {
        // WhatsApp format: 5511999999999@c.us
        const formattedNumber = `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp Microservice running on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Array to store messages and users
let messages = [];
let users = []; // Array to store connected users

// Broadcast message to all clients
function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', data: message }));
        }
    });
}

// Broadcast file message to all clients
function broadcastFileMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'file', data: message }));
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send all previous messages to the new client
    ws.send(JSON.stringify({ type: 'messages', data: messages }));

    let username = '';

    // Listen for incoming messages
    ws.on('message', (message) => {
        const msg = JSON.parse(message);

        if (msg.type === 'chat') {
            const { username: user, message: text } = msg;

            // Check if the user is already connected
            if (!username) {
                username = user; // Set the username for this connection
                users.push({ username, connection: ws }); // Store user connection
            }

            const newMessage = { username, message: text };
            messages.push(newMessage); // Store message in the message array

            // Broadcast the message to all connected clients
            broadcastMessage(newMessage);
        }

        // Handle file messages (e.g., image, pdf, etc.)
        if (msg.type === 'file') {
            const { username, file } = msg;
            const fileMessage = {
                username,
                message: `Sent a file: ${file.name}`,
                file: file // Base64 file content
            };

            messages.push(fileMessage); // Store file message
            broadcastFileMessage(fileMessage); // Broadcast file message
        }
    });

    // Handle WebSocket closure
    ws.on('close', () => {
        // Remove the user from the users array when they disconnect
        users = users.filter(user => user.connection !== ws);
        console.log('Client disconnected');
    });

    // Handle WebSocket errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Serve static files (your HTML, CSS, JS files)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000; // Use Railway's port or 3000 for local
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
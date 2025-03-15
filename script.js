const socket = new WebSocket('ws://localhost:3000'); // Correct WebSocket URL
const startChatButton = document.getElementById('start-chat');
const usernameInput = document.getElementById('username');
const chatBox = document.getElementById('chat-box');
const chatArea = document.getElementById('chat-area');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');
const logoutButton = document.getElementById('logout');
const loginContainer = document.getElementById('login-container');
const fileInput = document.getElementById('file-input');
const galleryIcon = document.getElementById('gallery-icon');
const creatorUsername = "admin"; // Define the creator username
const clearAllChatButton = document.getElementById('clear-all-chat');

let username = '';

// Start chat
startChatButton.addEventListener('click', () => {
    username = usernameInput.value;
    if (username) {
        loginContainer.style.display = 'none';
        chatBox.style.display = 'block';
        socket.send(JSON.stringify({ type: 'chat', username, message: 'has joined the chat!' }));
        checkIfCreator(username); // Check if the logged-in user is the creator
    } else {
        alert('Please enter a username');
    }
});

// Send a message
sendMessageButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message) {
        socket.send(JSON.stringify({ type: 'chat', username, message }));
        chatInput.value = '';  // Clear input field after sending
    }
});

// Log out
logoutButton.addEventListener('click', () => {
    chatBox.style.display = 'none';
    loginContainer.style.display = 'block';
    socket.send(JSON.stringify({ type: 'chat', username, message: 'has left the chat.' }));
    username = '';
    checkIfCreator(''); // Reset creator-specific elements on logout
});

// Open file input when gallery icon is clicked
galleryIcon.addEventListener('click', () => {
    fileInput.click();  // Trigger file input
});

// Handle file selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = {
                username,
                file: {
                    name: file.name,
                    type: file.type,
                    content: event.target.result // Base64 content of the file
                }
            };
            socket.send(JSON.stringify({ type: 'file', data: fileData }));
        };
        reader.readAsDataURL(file);  // Read the file as base64
    }
});

// Handle messages from WebSocket
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'messages') {
        data.data.forEach(msg => {
            displayMessage(msg.username, msg.message, msg.file);
        });
    } else if (data.type === 'chat') {
        displayMessage(data.data.username, data.data.message, null);
    } else if (data.type === 'file') {
        displayMessage(data.data.username, data.data.message, data.data.file);
    }
};

// Display messages
function displayMessage(username, message, file) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    
    let messageContent = `<strong>${username}</strong>: ${message}`;

    // Display file if present
    if (file) {
        if (file.type.startsWith('image')) {
            messageContent += `<br><img src="${file.content}" alt="${file.name}" style="max-width: 200px;">`;
        } else {
            messageContent += `<br><a href="${file.content}" target="_blank">${file.name}</a>`;
        }
    }

    msgDiv.innerHTML = messageContent;
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;  // Scroll to the latest message
}

// Check if the current user is the creator
function checkIfCreator(username) {
    if (username === creatorUsername) {
        clearAllChatButton.style.display = 'inline-block';
        
        // Add event listener for clearing all chat messages
        clearAllChatButton.addEventListener('click', () => {
            clearAllChats();
        });
    } else {
        clearAllChatButton.style.display = 'none'; // Hide the button for non-creator users
    }
}

// Function to clear all chat messages
function clearAllChats() {
    // Clear the chat area
    chatArea.innerHTML = '';

    // Optionally, you can also broadcast a message saying the chat has been cleared
    socket.send(JSON.stringify({
        type: 'chat',
        username: 'System',
        message: 'The chat history has been cleared by the admin.'
    }));
}

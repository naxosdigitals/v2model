import { formatText, queueMathJaxTypeset } from './formatting.js';
import { config } from './config.js';


const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// Initialize userId variable
let userId = "1234"; // Default value if not received from the parent

const currentProjectId = localStorage.getItem('currentProjectId'); // Adjust as necessary

document.getElementById("message-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  sendButton.style.display = input.value.trim() ? "flex" : "none";
});

async function sendMessage() {
  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Display and format user message
  displayMessage(userMessage, "user-message");

  // Construct the user message in the specific format
  const userTurn = {
    id: generateUniqueId(), // Function to generate unique ID
    type: "user",
    message: userMessage,
    timestamp: Date.now(),
  };

  // Post the user message back to the parent
  window.parent.postMessage({ type: "newMessage", turn: userTurn, userId: userId }, "*");
  console.log("User message sent to parent:", userTurn);

  input.value = "";
  sendButton.style.display = "none";

  const typingIndicator = document.createElement("div");
  typingIndicator.className = "message bot-message typing-indicator";
  typingIndicator.innerHTML = `<div class="typing-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  messagesDiv.appendChild(typingIndicator);

  let botMessage = "";

  try {
      const response = await fetch(config.fetchurl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage, 
            userId: userId,
            projectId: config.projectid
          })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to receive a response.");

      const decoder = new TextDecoder("utf-8");

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          botMessage += chunk;

          typingIndicator.innerHTML = formatText(botMessage);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;

          queueMathJaxTypeset();
      }

      typingIndicator.remove();
      displayMessage(botMessage, "bot-message");

      // Construct the bot message in the specific format
      const botTurn = {
          id: generateUniqueId(),
          type: "system",
          timestamp: Date.now(),
          messages: [
              {
                  ai: true,
                  delay: 0,
                  text: [
                      {
                          children: [{ text: botMessage }],
                      },
                  ],
              },
          ],
          actions: [
              {
                  name: "Tell me More",
                  request: { type: "path-25ak43jsd", payload: {} },
              },
          ],
      };

      // Post the bot message back to the parent
      window.parent.postMessage({ type: "newMessage", turn: botTurn, userId: userId }, "*");
      console.log("Bot message sent to parent:", botTurn);

  } catch (error) {
      console.error("Error fetching bot response:", error);
      typingIndicator.innerHTML = "Error: Unable to process message.";
  }
}

// Helper function to generate unique IDs for each message
function generateUniqueId() {
  return 'id-' + Math.random().toString(36).substr(2, 16);
}


  

function displayMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${className}`;
  messageDiv.innerHTML = formatText(text);
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Trigger MathJax to render any LaTeX expressions in the message
  queueMathJaxTypeset();
}

function renderChatHistory(chatHistory) {
    // Clear all current messages
    messagesDiv.innerHTML = '';

    chatHistory.forEach((message) => {
      const messageDiv = document.createElement("div");
  
      if (message.type === 'user') {
        // User messages have a direct `message` field
        messageDiv.className = "message user-message";
        messageDiv.innerHTML = formatText(message.message);
      } else if (message.type === 'system' && message.messages) {
        // System messages contain an array of messages with text in nested children
        messageDiv.className = "message bot-message";
  
        const systemMessageContent = message.messages
          .map(msg => msg.text && msg.text.map(textObj => 
            textObj.children.map(child => child.text).join(' ')
          ).join(' '))
          .join(' ');
  
        messageDiv.innerHTML = formatText(systemMessageContent);
      }
  
      messagesDiv.appendChild(messageDiv);
    });
  
    // Scroll to the bottom after loading
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
        // Trigger a full page reload (use cautiously)
        

}

  
  

// Listen for messages from the parent or other origins
// Listen for messages from the parent or other origins
window.addEventListener("message", (event) => {
  // Check if the event origin is trusted
  if (!event.origin.includes(config.origin)) return;

  const { setUserId, type, chatHistory } = event.data;

  // Handle setting user ID
  if (setUserId) {
    console.log("Received setUserId:", setUserId);
    userId = setUserId; // Update userId dynamically
  }

  // Handle setting chat history
  if (type === 'setChatHistory' && Array.isArray(chatHistory)) {
    console.log("Received chat history:", chatHistory);
    renderChatHistory(chatHistory); // Render the received chat history
  }

  // Handle clearing chat history
  if (type === 'clearChatHistory') {
    console.log("Received clearChatHistory message");
    clearChatMessages(); // Call function to clear chat history
  }
});

// Function to clear chat messages
function clearChatMessages() {
  const messagesDiv = document.getElementById("messages");
  if (messagesDiv) {
    messagesDiv.innerHTML = ''; // Clear all chat messages
    console.log("Chat history cleared in iframe");
  }
}

  
  


window.sendMessage = sendMessage;

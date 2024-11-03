import { formatText, queueMathJaxTypeset } from './formatting.js';
import { config } from './config.js';
import { setUserId } from './userConfig.js';


const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");


// Initialize userId variable
let userId = generateRandomUserId(); // Default ID if not received
setUserId(userId); // Default value if not received from the parent

const currentProjectId = localStorage.getItem('currentProjectId'); // Adjust as necessary

input.addEventListener("input", () => {
  sendButton.style.display = input.value.trim() ? "flex" : "none";
  autoResize(); // Adjust height on input
});

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevents new line if Enter is pressed without Shift
    sendMessage();
  }
});

input.addEventListener("input", autoResize);

// Adjust the height of the textarea to fit content
function autoResize() {
  input.style.height = 'auto'; // Reset height
  input.style.height = input.scrollHeight + 'px'; // Set to scrollHeight to expand
}

async function sendMessage() {
  const userMessage = input.value.trim();
  const previewImage = document.getElementById("preview-image");
  const messagesDiv = document.getElementById("messages");

  // If there's no text and no image, exit the function
  if (!userMessage && !(previewImage.src && document.getElementById("image-preview").style.display === "block")) return;

  // Construct the message as a single concatenated string with a marker for the image
  let payloadMessage = userMessage;
  let entity = "";
// Prepend /vision if there is an image in the preview
if (previewImage.src && document.getElementById("image-preview").style.display === "block") {
  payloadMessage = payloadMessage;
  entity = '/Visioninspectimage' // Prepend /vision to the user message
}


  // Display the user message as text if there is any
  if (userMessage) {
    displayMessage(userMessage, "user-message");
    input.value = ""; 
// Clear text input after displaying
  }

  // Display the image in the chat as part of the user's message, if there's an image
  if (previewImage.src && document.getElementById("image-preview").style.display === "block") {
    const imageMessageDiv = document.createElement("div");
    imageMessageDiv.className = "message user-message";
    imageMessageDiv.innerHTML = `<img src="${previewImage.src}" alt="User uploaded image" style="max-width: 150px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">`;
    messagesDiv.appendChild(imageMessageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Clear the image preview after displaying it in the chat
  clearImagePreview();

  const userTurn = {
    id: generateUniqueId(),
    type: "user",
    message: payloadMessage,
    timestamp: Date.now(),
  };
  window.parent.postMessage({ type: "newMessage", turn: userTurn, userId: userId }, "*");


  // Add typing indicator before making the request
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "message bot-message typing-indicator";
  typingIndicator.innerHTML = `<div class="typing-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  messagesDiv.appendChild(typingIndicator);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Send the concatenated message to the GCP server as a single string
  try {
    const response = await fetch(config.fetchurl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: `${entity}, ${payloadMessage}`,
        userId: userId,
        projectId: config.projectid
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // Clear the input after sending
    input.value = "";
    sendButton.style.display = "none";
    input.style.height = 'auto';

    entity = "";
    let botMessage = "";

    const reader = response.body?.getReader();
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
          // Add the base64 image URL if it exists
          ...(previewImage.src && document.getElementById("image-preview").style.display === "block"
              ? [
                  {
                      ai: true,
                      delay: 0,
                      type: "image",
                      url: window.base64ImageUrl  // Adding the base64 data URL here
                  }
              ]
              : [])
      ],
      actions: [
          {
              name: "Tell me More",
              request: { type: "path-25ak43jsd", payload: {} },
          },
      ],
  };
  
  // Send botTurn with the image URL if available
  window.parent.postMessage({ type: "newMessage", turn: botTurn, userId: userId }, "*");
  console.log("Bot message sent to parent:", botTurn);
  window.base64ImageUrl = "";
  
  } catch (error) {
    console.error("Error sending message to GCP server:", error);
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
  if (!config.origin.some(allowedOrigin => event.origin.includes(allowedOrigin))) return;

  const { setUserId, type, chatHistory, imageUrl } = event.data;

  // Handle setting user ID
  if (setUserId) {
    userId = setUserId;
    setuseriDparent(setUserId); // Update userId dynamically
  }

  // Handle setting chat history
  if (type === 'setChatHistory' && Array.isArray(chatHistory)) {
    renderChatHistory(chatHistory); // Render the received chat history
  }

  // Handle clearing chat history
  if (type === 'clearChatHistory') {
    clearChatMessages(); // Call function to clear chat history
  }

  // Handle image URL
  if (type === 'imageUrl' && imageUrl) {
    console.log("Received image URL:", imageUrl);
    
    // Display or process the image URL as needed
    const img = document.getElementById('receivedImage');
    if (img) {
      img.src = imageUrl; // Set the image source to the received URL
    }
  }
});


function setuseriDparent(userId) {
  setUserId(userId);
  //console.log("User ID set to config:", userId);
}

// Function to clear chat messages
function clearChatMessages() {
  const messagesDiv = document.getElementById("messages");
  if (messagesDiv) {
    messagesDiv.innerHTML = ''; // Clear all chat messages
    //console.log("Chat history cleared in iframe");
  }
}

function generateRandomUserId() {
  const randomNumber = Math.floor(Math.random() * 1000000); // Generates a number from 0 to 999999
  return `noidfound${randomNumber.toString().padStart(6, '0')}`; // Ensures 6 digits
} 
  // Add event listeners for drag-and-drop and file upload



window.sendMessage = sendMessage;

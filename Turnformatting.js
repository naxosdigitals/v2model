function createBotTurn(botMessage) {
    return {
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
        ...(imageUrl
          ? [
              {
                ai: true,
                delay: 0,
                type: "image",
                url: imageUrl, // Using imageUrl parameter
              },
            ]
          : []),
      ],
      actions: [
        {
          name: "Tell me More",
          request: { type: "path-25ak43jsd", payload: {} },
        },
      ],
    };
  }
  
  // Example usage
  const botMessage = "Here's the bot's response.";
  const imageUrl = window.base64ImageUrl || null; // Optional image URL
  
  // Generate botTurn object using the function
  const botTurn = createBotTurn(botMessage, imageUrl);
  
  // Post the botTurn object
  window.parent.postMessage({ type: "newMessage", turn: botTurn, userId: userId }, "*");
  
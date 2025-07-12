/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const currentQuestionDiv = document.getElementById("currentQuestion");
const questionText = document.getElementById("questionText");

// Conversation history to maintain context across interactions
let conversationHistory = [];

// L'Oréal-focused system prompt to guide the chatbot
const SYSTEM_PROMPT = `You are a knowledgeable L'Oréal beauty advisor and product expert. Your role is to:

1. Help customers discover L'Oréal products that match their needs
2. Provide skincare and makeup routine recommendations
3. Answer questions about L'Oréal product ingredients, benefits, and usage
4. Suggest products for different skin types, concerns, and preferences
5. Share beauty tips and application techniques

STRICT GUIDELINES - ALWAYS FOLLOW THESE:
- ONLY discuss L'Oréal products, brands, and beauty-related topics
- If asked about non-beauty topics (politics, sports, technology, etc.), politely refuse and redirect to beauty
- If asked about competitor brands, acknowledge briefly but redirect to L'Oréal alternatives
- For unrelated questions, use responses like: "I'm here to help with L'Oréal beauty advice! Let me know about your skincare or makeup needs instead."
- Be helpful, friendly, and professional at all times
- Keep responses concise and actionable
- If you don't know specific product details, acknowledge this honestly
- REMEMBER previous conversation context, user preferences, and past recommendations
- Address users by name if they provide it and reference their previous questions naturally

WHAT TO REFUSE (with polite redirection):
- Questions about other companies, current events, personal advice unrelated to beauty
- Technical support for non-beauty topics
- General life advice not related to beauty/skincare

ACCEPTABLE TOPICS:
- L'Oréal product recommendations and information
- Skincare routines and tips
- Makeup application techniques
- Beauty concerns and solutions
- Ingredient information for cosmetics

L'Oréal brands include: L'Oréal Paris, Maybelline, Lancôme, Urban Decay, YSL Beauty, Giorgio Armani Beauty, Kiehl's, Garnier, and many others.

Remember: Always redirect off-topic questions back to L'Oréal beauty topics with a friendly tone. Use conversation history to provide personalized, contextual responses.`;

// Set initial welcome message and initialize conversation history
chatWindow.innerHTML = `
  <div class="msg ai">
    <div class="bubble">👋 Hello! I'm your L'Oréal Smart Product Advisor. 
  
I can help you find the perfect L'Oréal products, create beauty routines, and answer questions about skincare and makeup. 

Feel free to tell me your name and what you'd like to know - I'll remember our conversation to give you personalized advice!</div>
  </div>
`;

// Initialize conversation history with system prompt
conversationHistory = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clean it
  const userMessage = userInput.value.trim();

  // Don't send empty messages
  if (!userMessage) {
    return;
  }

  // Display the current user question above the chat
  displayCurrentQuestion(userMessage);

  // Add user message to chat
  addMessageToChat("user", userMessage);

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Clear input field
  userInput.value = "";

  // Show typing indicator
  addMessageToChat("ai", "Thinking...");

  try {
    // Send request to Cloudflare Worker endpoint instead of directly to OpenAI
    const response = await fetch(
      "https://makeup-worker.orss3214.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory, // Send entire conversation history for context
        }),
      }
    );

    // Remove typing indicator
    removeLastMessage();

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();

    // Get the chatbot's reply
    const botReply = data.choices[0].message.content;

    // Add bot response to chat
    addMessageToChat("ai", botReply);

    // Add bot response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: botReply,
    });

    // Keep conversation history manageable (last 20 messages + system prompt)
    // This prevents the API request from getting too large
    if (conversationHistory.length > 21) {
      // Keep system prompt and last 20 messages
      conversationHistory = [
        conversationHistory[0], // Keep system prompt
        ...conversationHistory.slice(-20), // Keep last 20 messages
      ];
    }

    // Log conversation history for debugging (students can see in console)
    console.log("Current conversation history:", conversationHistory);
  } catch (error) {
    // Remove typing indicator
    removeLastMessage();

    // Show error message to user
    addMessageToChat(
      "ai",
      "Sorry, I'm having trouble connecting right now. Please try again in a moment!"
    );

    // Log error for debugging (students can see this in browser console)
    console.error("Error calling Cloudflare Worker:", error);
  }
});

/**
 * Add a message to the chat window with modern bubble styling
 * @param {string} sender - Either "user" or "ai"
 * @param {string} message - The message text to display
 */
function addMessageToChat(sender, message) {
  // Create message container
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("msg", sender);

  // Create bubble element for the message text
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.textContent = message;

  // Add bubble to message container
  messageDiv.appendChild(bubbleDiv);

  // Add message to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to bottom to show latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Remove the last message from chat (used to remove typing indicator)
 */
function removeLastMessage() {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage) {
    chatWindow.removeChild(lastMessage);
  }
}

/**
 * Display the current user question above the chat window
 * @param {string} question - The user's current question
 */
function displayCurrentQuestion(question) {
  // Update the question text
  questionText.textContent = question;

  // Show the current question div
  currentQuestionDiv.style.display = "block";
}

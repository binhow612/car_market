/**
 * Virtual Assistant Configuration
 * 
 * This file contains configuration settings for the virtual assistant.
 * Modify these values to customize the assistant's behavior and appearance.
 */

export const ASSISTANT_CONFIG = {
  // Display Settings
  display: {
    name: "CarMarket Assistant",
    tagline: "Always here to help",
    position: {
      bottom: "1.5rem", // 24px
      right: "1.5rem",  // 24px
    },
    colors: {
      primary: "blue", // Tailwind color name
      secondary: "gray",
    },
  },

  // Behavior Settings
  behavior: {
    typingDelay: 500, // ms - delay before showing assistant response
    autoFocusInput: true,
    autoScrollToLatest: true,
    markAsReadOnOpen: true,
    showUnreadBadge: true,
    maxMessages: 100, // Maximum messages to keep in history
  },

  // Response Settings
  responses: {
    defaultErrorMessage: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
    greetingTimeRanges: {
      morning: { start: 0, end: 12, greeting: "Good morning" },
      afternoon: { start: 12, end: 18, greeting: "Good afternoon" },
      evening: { start: 18, end: 24, greeting: "Good evening" },
    },
  },

  // Feature Flags
  features: {
    enableSuggestions: true,
    enableActions: true,
    enableKeyboardShortcuts: true,
    enableMinimize: true,
    enableClearChat: true,
    enableTimestamps: true,
    enableTypingIndicator: true,
  },

  // Keyboard Shortcuts
  shortcuts: {
    send: "Enter",
    newLine: "Shift+Enter",
    close: "Escape",
  },

  // UI Settings
  ui: {
    chatWidth: "24rem", // w-96
    chatHeight: "600px",
    minimizedHeight: "4rem", // h-16
    borderRadius: "1rem", // rounded-2xl
    shadow: "2xl",
    maxMessageWidth: "80%",
  },

  // Analytics (optional - for future implementation)
  analytics: {
    enabled: false,
    trackQueries: false,
    trackNavigations: false,
  },
} as const;

/**
 * Common queries that users frequently ask
 * Used for suggestions and quick responses
 */
export const COMMON_QUERIES = {
  buying: [
    "How do I search for cars?",
    "Show me cars under $20,000",
    "What are the popular car makes?",
    "How do I filter by price?",
    "Show me the latest listings",
    "How do I save cars to favorites?",
  ],
  selling: [
    "How do I sell my car?",
    "How should I price my car?",
    "What photos should I upload?",
    "How to write a good description?",
    "Tips for selling faster",
    "How do I edit my listing?",
  ],
  account: [
    "How do I create an account?",
    "How do I change my password?",
    "How do I update my profile?",
    "Benefits of creating an account",
  ],
  communication: [
    "How do I contact a seller?",
    "How do I check my messages?",
    "Tips for messaging sellers",
    "Safety tips for meetings",
  ],
  general: [
    "How does CarMarket work?",
    "Is CarMarket free to use?",
    "How do I report a listing?",
    "How do I delete my account?",
  ],
} as const;

/**
 * Quick action templates for common tasks
 */
export const QUICK_ACTIONS = {
  authentication: {
    signIn: { label: "Sign In", path: "/login" },
    signUp: { label: "Create Account", path: "/register" },
  },
  navigation: {
    home: { label: "Home", path: "/" },
    search: { label: "Search Cars", path: "/" },
    sell: { label: "Sell Your Car", path: "/sell-car" },
    myListings: { label: "My Listings", path: "/my-listings" },
    favorites: { label: "Favorites", path: "/favorites" },
    messages: { label: "Messages", path: "/conversations" },
    profile: { label: "Profile", path: "/profile" },
  },
} as const;

/**
 * Response templates for common scenarios
 */
export const RESPONSE_TEMPLATES = {
  needsAuth: "To access this feature, please sign in to your account first.",
  success: "Great! I can help you with that.",
  error: "I'm having trouble with that request. Please try again.",
  notFound: "I couldn't find what you're looking for. Can you provide more details?",
  redirecting: "Taking you there now...",
} as const;

/**
 * Intent keywords for query classification
 * Used by the assistant service to understand user intent
 */
export const INTENT_KEYWORDS = {
  greeting: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"],
  buying: ["buy", "purchase", "find", "search", "looking for", "show me", "browse"],
  selling: ["sell", "list", "post", "advertise", "create listing"],
  pricing: ["price", "cost", "expensive", "cheap", "budget", "afford"],
  howTo: ["how to", "how do", "guide", "help me", "show me how", "tutorial"],
  favorite: ["favorite", "save", "bookmark", "wishlist", "like"],
  chat: ["chat", "message", "contact", "seller", "communicate"],
  account: ["account", "profile", "settings", "password", "email"],
  filter: ["filter", "refine", "narrow", "specific", "criteria"],
  thanks: ["thank", "thanks", "appreciate", "helpful"],
} as const;

/**
 * Helper function to get greeting based on time
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  const { greetingTimeRanges } = ASSISTANT_CONFIG.responses;

  if (hour >= greetingTimeRanges.morning.start && hour < greetingTimeRanges.morning.end) {
    return greetingTimeRanges.morning.greeting;
  } else if (hour >= greetingTimeRanges.afternoon.start && hour < greetingTimeRanges.afternoon.end) {
    return greetingTimeRanges.afternoon.greeting;
  } else {
    return greetingTimeRanges.evening.greeting;
  }
}

/**
 * Helper function to validate configuration
 */
export function validateConfig(): boolean {
  try {
    // Basic validation
    if (!ASSISTANT_CONFIG.display.name) return false;
    if (!ASSISTANT_CONFIG.behavior.typingDelay || ASSISTANT_CONFIG.behavior.typingDelay < 0) return false;
    if (!ASSISTANT_CONFIG.ui.chatWidth || !ASSISTANT_CONFIG.ui.chatHeight) return false;
    
    return true;
  } catch {
    return false;
  }
}

// Validate on import
if (!validateConfig()) {
  console.warn("Assistant configuration is invalid. Using default values.");
}


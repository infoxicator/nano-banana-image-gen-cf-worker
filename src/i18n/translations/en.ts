export const en = {
  // Main title and subtitle
  title: "I Was There!",
  subtitle: "Upload a picture and select the date to be transported to that place in history",
  
  // Instructions
  instructionsTitle: "How This Time Machine Works:",
  step1Title: "Pick Your Time Destination:",
  step1Description: "Choose any month and day from history. This becomes your time travel destination - the AI will create a historical newspaper based on your chosen date.",
  step2Title: "Capture or Upload Your Photo:",
  step2Description: "Take a selfie or upload any meaningful image. Our AI will make you the star of a historical newspaper from your chosen era!",
  step3Title: "Add Your Style Twist (Optional):",
  step3Description: "Want a vintage sepia look? Ghibli animation style? Polaroid aesthetic? Add your creative style preferences to customize the experience.",
  step4Title: "Travel Back in Time:",
  step4Description: "Hit the time travel button and watch as your photo becomes the centerpiece of an authentic historical newspaper!",
  
  // Month names
  months: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December"
  },
  
  // Form elements
  datePickerLabel: "Select your travel date:",
  datePickerMonthPlaceholder: "Choose month",
  datePickerDayPlaceholder: "Choose day",
  
  imageUploadLabel: "Take a selfie or upload an image:",
  imageUploadInstruction: "Click to upload or drag and drop your image",
  imageUploading: "Uploading image...",
  imageUploadError: "Failed to upload image. Please try again.",
  imageSelected: "Selected",
  imageUploadSuccess: "Image uploaded successfully!",
  
  promptLabel: "Style preferences (optional):",
  promptPlaceholder: "Enter a style like 'Ghibli', 'polaroid', 'black and white', 'vintage sepia', 'oil painting'...",
  charactersLabel: "characters",
  
  // Buttons
  submitButton: "Transport Me Back in Time!",
  submitButtonLoading: "Time Traveling...",
  downloadButton: "📥 Download as Image",
  downloadButtonLoading: "📸 Capturing...",
  
  // Loading
  loadingMessage: "Generating your image... This will take about 30 seconds.",
  
  // Share buttons
  shareTitle: "Share your creation:",
  facebookButton: "Facebook",
  twitterButton: "X (Twitter)",
  instagramButton: "Instagram",
  shareButtonLoading: "Preparing...",
  
  // Results
  resultTitle: "Here's Your Newspaper Frontpage:",
  
  // Error messages
  errorSelectDateAndImage: "Please upload an image and select a date.",
  errorFailedToProcess: "Failed to process request",
  errorUnknown: "An unknown error occurred",
  errorFailedToUpload: "Failed to upload image",
  errorFailedToPrepareSharing: "Failed to prepare image for sharing. Please try again.",
  
  // Share messages
  facebookShareText: "Check out this newspaper from my Ai Time Travel journey:",
  twitterShareText: "Check out this newspaper from my Ai Time Travel journey 📰✨",
  instagramShareMessage: "Check out this newspaper from my Ai Time Travel journey 📰✨\n\nDownload the image from:",
  instagramShareSuccess: "Image link and caption copied to clipboard! Open Instagram and paste it in your story or post.",
  instagramShareFallback: "Please copy this manually:\n\nAnd use this caption: \"Check out this newspaper from my Ai Time Travel journey 📰✨\"",
  
  // Loading messages
  loading: "Loading...",
  
  // Language toggle
  language: "Language",
  languageEnglish: "English",
  languageSpanish: "Spanish",
  
  // For Nerds section
  forNerdsTitle: "For Nerds",
  forNerdsDescription: "Built with Cloudflare Workers, React, and Gemini AI",
  forNerdsWatchVideo: "Watch how it's built"
};

export type TranslationKeys = typeof en;
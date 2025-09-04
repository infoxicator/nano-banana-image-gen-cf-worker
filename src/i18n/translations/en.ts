export const en = {
  // Main title and subtitle
  title: "I Was There!",
  subtitle: "Upload a picture and select the date to be transported to that place in history",
  
  // Instructions
  instructionsTitle: "How This Time Machine Works:",
  step1Title: "Choose Your Date:",
  step1Description: "Select any month and day from history. This will be your destination in time - the exact moment you'll experience through your photograph.",
  step2Title: "Upload Your Photograph:",
  step2Description: "Share any image that holds meaning for you. Our AI will transport this image back to your chosen historical date, reimagining how it would appear in that era.",
  step3Title: "Add Context (Optional):",
  step3Description: "Describe any specific historical elements, atmosphere, or details you'd like to see incorporated into your time-traveled image.",
  step4Title: "Begin Your Journey:",
  step4Description: "Click the time travel button and watch as your modern photograph transforms into a historical scene from your chosen date.",
  
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
  
  imageUploadLabel: "Upload your photograph:",
  imageUploadInstruction: "Click to upload or drag and drop your image",
  imageUploading: "Uploading image...",
  imageUploadError: "Failed to upload image. Please try again.",
  
  promptLabel: "Additional context (optional):",
  promptPlaceholder: "Describe any specific details you'd like to see in your historical journey...",
  charactersLabel: "characters",
  
  // Buttons
  submitButton: "Transport Me Back in Time!",
  submitButtonLoading: "Time Traveling...",
  downloadButton: "📥 Download as Image",
  downloadButtonLoading: "📸 Capturing...",
  
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
  languageSpanish: "Spanish"
};

export type TranslationKeys = typeof en;
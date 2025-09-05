import type { TranslationKeys } from './en';

export const es: TranslationKeys = {
  // Main title and subtitle
  title: "¡Yo Estuve Ahí!",
  subtitle: "Sube una foto y selecciona la fecha para ser transportado a ese lugar en la historia",
  
  // Instructions
  instructionsTitle: "Cómo Funciona Esta Máquina del Tiempo:",
  step1Title: "Elige Tu Destino en el Tiempo:",
  step1Description: "Selecciona cualquier mes y día de la historia. Este será tu destino temporal - la IA creará un periódico histórico basado en tu fecha elegida.",
  step2Title: "Tómate una Foto o Sube una Imagen:",
  step2Description: "Hazte una selfie o sube cualquier imagen significativa. ¡Nuestra IA te convertirá en la estrella de un periódico histórico de tu época elegida!",
  step3Title: "Añade Tu Toque de Estilo (Opcional):",
  step3Description: "¿Quieres un look sepia vintage? ¿Estilo de animación Ghibli? ¿Estética polaroid? Añade tus preferencias creativas de estilo para personalizar la experiencia.",
  step4Title: "Viaja al Pasado:",
  step4Description: "¡Presiona el botón de viaje en el tiempo y observa cómo tu foto se convierte en la pieza central de un auténtico periódico histórico!",
  
  // Month names
  months: {
    january: "Enero",
    february: "Febrero",
    march: "Marzo",
    april: "Abril",
    may: "Mayo",
    june: "Junio",
    july: "Julio",
    august: "Agosto",
    september: "Septiembre",
    october: "Octubre",
    november: "Noviembre",
    december: "Diciembre"
  },
  
  // Form elements
  datePickerLabel: "Selecciona tu fecha de viaje:",
  datePickerMonthPlaceholder: "Elegir mes",
  datePickerDayPlaceholder: "Elegir día",
  
  imageUploadLabel: "Tómate una selfie o sube una imagen:",
  imageUploadInstruction: "Haz clic para subir o arrastra y suelta tu imagen",
  imageUploading: "Subiendo imagen...",
  imageUploadError: "Error al subir la imagen. Por favor, intenta de nuevo.",
  imageSelected: "Seleccionado",
  imageUploadSuccess: "¡Imagen subida exitosamente!",
  
  promptLabel: "Preferencias de estilo (opcional):",
  promptPlaceholder: "Ingresa un estilo como 'Ghibli', 'polaroid', 'blanco y negro', 'sepia vintage', 'pintura al óleo'...",
  charactersLabel: "caracteres",
  
  // Buttons
  submitButton: "¡Transpórtame al Pasado!",
  submitButtonLoading: "Viajando en el Tiempo...",
  downloadButton: "📥 Descargar como Imagen",
  downloadButtonLoading: "📸 Capturando...",
  
  // Loading
  loadingMessage: "Generando tu imagen... Esto tomará aproximadamente 30 segundos.",
  
  // Share buttons
  shareTitle: "Comparte tu creación:",
  facebookButton: "Facebook",
  twitterButton: "X (Twitter)",
  instagramButton: "Instagram",
  shareButtonLoading: "Preparando...",
  
  // Results
  resultTitle: "¡Aquí está la Portada de Tu Periódico:",
  
  // Error messages
  errorSelectDateAndImage: "Por favor sube una imagen y selecciona una fecha.",
  errorFailedToProcess: "Error al procesar la solicitud",
  errorUnknown: "Ha ocurrido un error desconocido",
  errorFailedToUpload: "Error al subir la imagen",
  errorFailedToPrepareSharing: "Error al preparar la imagen para compartir. Por favor, intenta de nuevo.",
  
  // Share messages
  facebookShareText: "¡Mira este periódico de mi viaje en el tiempo con IA!",
  twitterShareText: "¡Mira este periódico de mi viaje en el tiempo con IA! 📰✨",
  instagramShareMessage: "¡Mira este periódico de mi viaje en el tiempo con IA! 📰✨\n\nDescarga la imagen desde:",
  instagramShareSuccess: "¡Enlace de imagen y descripción copiados al portapapeles! Abre Instagram y pégalo en tu historia o publicación.",
  instagramShareFallback: "Por favor copia esto manualmente:\n\nY usa esta descripción: \"¡Mira este periódico de mi viaje en el tiempo con IA! 📰✨\"",
  
  // Loading messages
  loading: "Cargando...",
  
  // Language toggle
  language: "Idioma",
  languageEnglish: "Inglés",
  languageSpanish: "Español",
  
  // For Nerds section
  forNerdsTitle: "Para Nerds",
  forNerdsDescription: "Construido con Cloudflare Workers, React, y Gemini AI",
  forNerdsWatchVideo: "Ver cómo está construido"
};
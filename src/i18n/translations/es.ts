import type { TranslationKeys } from './en';

export const es: TranslationKeys = {
  // Main title and subtitle
  title: "¡Yo Estuve Ahí!",
  subtitle: "Sube una foto y selecciona la fecha para ser transportado a ese lugar en la historia",
  
  // Instructions
  instructionsTitle: "Cómo Funciona Esta Máquina del Tiempo:",
  step1Title: "Elige Tu Fecha:",
  step1Description: "Selecciona cualquier mes y día de la historia. Este será tu destino en el tiempo - el momento exacto que experimentarás a través de tu fotografía.",
  step2Title: "Sube Tu Fotografía:",
  step2Description: "Comparte cualquier imagen que tenga significado para ti. Nuestra IA transportará esta imagen de vuelta a tu fecha histórica elegida, reimaginándola como habría aparecido en esa época.",
  step3Title: "Añade Contexto (Opcional):",
  step3Description: "Describe cualquier elemento histórico específico, atmósfera o detalles que te gustaría ver incorporados en tu imagen viajada en el tiempo.",
  step4Title: "Comienza Tu Viaje:",
  step4Description: "Haz clic en el botón de viaje en el tiempo y observa cómo tu fotografía moderna se transforma en una escena histórica de tu fecha elegida.",
  
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
  
  imageUploadLabel: "Sube tu fotografía:",
  imageUploadInstruction: "Haz clic para subir o arrastra y suelta tu imagen",
  imageUploading: "Subiendo imagen...",
  imageUploadError: "Error al subir la imagen. Por favor, intenta de nuevo.",
  
  promptLabel: "Contexto adicional (opcional):",
  promptPlaceholder: "Describe cualquier detalle específico que te gustaría ver en tu viaje histórico...",
  charactersLabel: "caracteres",
  
  // Buttons
  submitButton: "¡Transpórtame al Pasado!",
  submitButtonLoading: "Viajando en el Tiempo...",
  downloadButton: "📥 Descargar como Imagen",
  downloadButtonLoading: "📸 Capturando...",
  
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
  languageSpanish: "Español"
};
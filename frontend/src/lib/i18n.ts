import { Language } from "@/types";

export interface TranslationDict {
  appName: string;
  tagline: string;
  installApp: string;
  appInstalled: string;
  scanCrop: string;
  weatherAdvisory: string;
  scanHistory: string;
  heroHeading: string;
  heroSubtitle: string;
  snapPhoto: string;
  uploadPhoto: string;
  dragDrop: string;
  dropToUpload: string;
  analyzingLeaf: string;
  runningVision: string;
  diagnosisResult: string;
  confidence: string;
  pathogen: string;
  severity: string;
  listenRemedies: string;
  stopAudio: string;
  organicTab: string;
  chemicalTab: string;
  preventiveTab: string;
  weatherTab: string;
  aiAdvisoryTab: string;
  noChemicalsNeeded: string;
  weatherRisk: string;
  sprayingWindow: string;
  safeToSpray: string;
  dangerToSpray: string;
  temperature: string;
  humidity: string;
  windSpeed: string;
  rainfall: string;
  fetchingWeather: string;
  useMyLocation: string;
  locationDenied: string;
  searchCity: string;
  searchBtn: string;
  topCandidates: string;
  retakePhoto: string;
  saveDiagnosis: string;
  savedLocally: string;
  noSavedScans: string;
  clearHistory: string;
  lowConfidenceWarn: string;
  healthyCropMsg: string;
  emergencyAction: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: "CropDoc",
    tagline: "AI Crop Disease Doctor & Farm Weather Guardian",
    installApp: "Install CropDoc App",
    appInstalled: "App Installed",
    scanCrop: "Diagnose Crop",
    weatherAdvisory: "Agro Weather",
    scanHistory: "Scan History",
    heroHeading: "Identify Plant Diseases Instantly",
    heroSubtitle: "Capture or upload a photo of an infected leaf to receive instant AI diagnosis, organic remedies, and weather spraying advice.",
    snapPhoto: "Take Leaf Photo",
    uploadPhoto: "Upload from Gallery",
    dragDrop: "Drag & drop a leaf photo here, or click to browse",
    dropToUpload: "Release leaf image to analyze",
    analyzingLeaf: "Analyzing leaf pathology...",
    runningVision: "Running deep vision model and checking agronomic database",
    diagnosisResult: "Diagnosis & Prescription",
    confidence: "Model Confidence",
    pathogen: "Pathogen / Cause",
    severity: "Outbreak Severity",
    listenRemedies: "Listen to Remedies (Audio)",
    stopAudio: "Stop Audio",
    organicTab: "Organic Treatment",
    chemicalTab: "Chemical Control",
    preventiveTab: "Prevention & Culture",
    weatherTab: "Agro-Weather Impact",
    aiAdvisoryTab: "AI Action Plan",
    noChemicalsNeeded: "Plant is healthy! No chemical fungicides or pesticides are required.",
    weatherRisk: "Fungal Outbreak Risk",
    sprayingWindow: "Spraying Window Advisory",
    safeToSpray: "Safe for spraying",
    dangerToSpray: "Unfavorable for spraying",
    temperature: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    rainfall: "Precipitation",
    fetchingWeather: "Fetching hyper-local farm weather...",
    useMyLocation: "Use Farm GPS Location",
    locationDenied: "Location permission denied. You can search by city name.",
    searchCity: "Enter city or district...",
    searchBtn: "Check",
    topCandidates: "Differential Diagnosis (Other possibilities)",
    retakePhoto: "Diagnose Another Crop",
    saveDiagnosis: "Save to Phone",
    savedLocally: "Saved to Offline History",
    noSavedScans: "No previous crop scans stored on this device.",
    clearHistory: "Clear All History",
    lowConfidenceWarn: "Low diagnostic confidence. Please ensure the leaf is centered, well-lit, and in focus.",
    healthyCropMsg: "Great news! Your crop leaf shows healthy characteristics with no active disease detected.",
    emergencyAction: "24-Hour Action Protocol"
  },
  hi: {
    appName: "क्रॉप-डॉक (CropDoc)",
    tagline: "फसल रोग निदान एवं कृषि मौसम सलाहकार",
    installApp: "मोबाइल में ऐप इंस्टॉल करें",
    appInstalled: "ऐप इंस्टॉल है",
    scanCrop: "फसल जांचें",
    weatherAdvisory: "कृषि मौसम",
    scanHistory: "पुराने रिकॉर्ड",
    heroHeading: "फसल की बीमारी तुरंत पहचानें",
    heroSubtitle: "रोगग्रस्त पत्ते की फोटो खींचें या अपलोड करें और पाएं सटीक जैविक उपाय, रासायनिक उपचार और मौसम के अनुसार छिड़काव की सलाह।",
    snapPhoto: "कैमरे से फोटो लें",
    uploadPhoto: "गैलरी से चुनें",
    dragDrop: "पत्ते की फोटो यहाँ खींचें या चुनने के लिए क्लिक करें",
    dropToUpload: "जांचने के लिए फोटो छोड़ें",
    analyzingLeaf: "पत्ते के रोग का विश्लेषण हो रहा है...",
    runningVision: "एआई मॉडल और कृषि ज्ञानकोश से जांच जारी है",
    diagnosisResult: "निदान और उपचार पर्ची",
    confidence: "सटीकता स्तर",
    pathogen: "रोग कारक / जीवाणु",
    severity: "गंभीरता",
    listenRemedies: "उपाय सुनें (आवाज में)",
    stopAudio: "आवाज बंद करें",
    organicTab: "जैविक उपचार",
    chemicalTab: "रासायनिक उपचार",
    preventiveTab: "रोकथाम और बचाव",
    weatherTab: "मौसम का प्रभाव",
    aiAdvisoryTab: "विशेषज्ञ कार्ययोजना",
    noChemicalsNeeded: "फसल पूरी तरह स्वस्थ है! किसी कीटनाशक या दवा के छिड़काव की जरूरत नहीं है।",
    weatherRisk: "फफूंद / रोग का खतरा",
    sprayingWindow: "छिड़काव का सही समय",
    safeToSpray: "छिड़काव के लिए उपयुक्त मौसम",
    dangerToSpray: "छिड़काव के लिए अनुचित समय",
    temperature: "तापमान",
    humidity: "हवा में नमी",
    windSpeed: "हवा की गति",
    rainfall: "बारिश की संभावना",
    fetchingWeather: "खेत का मौसम प्राप्त हो रहा है...",
    useMyLocation: "खेत की जीपीएस लोकेशन से देखें",
    locationDenied: "लोकेशन की अनुमति नहीं मिली। कृपया शहर के नाम से खोजें।",
    searchCity: "शहर या जिले का नाम दर्ज करें...",
    searchBtn: "खोजें",
    topCandidates: "अन्य संभावित रोग",
    retakePhoto: "दूसरी फसल की जांच करें",
    saveDiagnosis: "मोबाइल में सुरक्षित करें",
    savedLocally: "ऑफलाइन सुरक्षित कर लिया गया",
    noSavedScans: "इस फोन पर कोई पिछला स्कैन सुरक्षित नहीं है।",
    clearHistory: "सभी रिकॉर्ड हटाएं",
    lowConfidenceWarn: "फोटो साफ नहीं लग रही है। कृपया पत्ते को रोशनी में रख कर साफ फोटो लें।",
    healthyCropMsg: "शुभ समाचार! पत्ते में किसी भी बीमारी के लक्षण नहीं पाए गए हैं, फसल स्वस्थ है।",
    emergencyAction: "24 घंटे में जरूरी कदम"
  }
};

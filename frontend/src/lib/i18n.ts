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
    tagline: "Plant Pathology & Field Advisory",
    installApp: "Install App",
    appInstalled: "App Installed",
    scanCrop: "Diagnose Leaf",
    weatherAdvisory: "Field Weather",
    scanHistory: "Saved Scans",
    heroHeading: "Plant Pathology & Crop Health",
    heroSubtitle: "Upload or capture a photo of a symptomatic leaf for immediate pathology identification, certified organic and chemical treatments, and local spraying advisories.",
    snapPhoto: "Take Photo",
    uploadPhoto: "Choose from Gallery",
    dragDrop: "Drag & drop a leaf photo here, or click to browse",
    dropToUpload: "Release image to begin analysis",
    analyzingLeaf: "Inspecting leaf tissue...",
    runningVision: "Evaluating symptoms against 38 plant pathology benchmarks",
    diagnosisResult: "Clinical Diagnosis & Prescription",
    confidence: "Diagnostic Certainty",
    pathogen: "Causal Pathogen",
    severity: "Severity Level",
    listenRemedies: "Listen to Prescription",
    stopAudio: "Stop Audio",
    organicTab: "Biological & Organic",
    chemicalTab: "Chemical Control",
    preventiveTab: "Cultural Prevention",
    weatherTab: "Environmental Triggers",
    aiAdvisoryTab: "Agronomic Plan",
    noChemicalsNeeded: "Foliage is healthy! No chemical fungicides or treatments required.",
    weatherRisk: "Spore Outbreak Risk",
    sprayingWindow: "Spraying Conditions",
    safeToSpray: "Optimal for application",
    dangerToSpray: "Unfavorable for application",
    temperature: "Temperature",
    humidity: "Relative Humidity",
    windSpeed: "Wind Speed",
    rainfall: "Precipitation",
    fetchingWeather: "Retrieving local meteorological telemetry...",
    useMyLocation: "Locate My Farm",
    locationDenied: "Location permission denied. Search by city name instead.",
    searchCity: "Enter city or agricultural district...",
    searchBtn: "Search",
    topCandidates: "Differential Diagnosis (Alternative Possibilities)",
    retakePhoto: "Diagnose Another Leaf",
    saveDiagnosis: "Save to Device",
    savedLocally: "Saved to Offline Records",
    noSavedScans: "No stored pathology scans found on this device.",
    clearHistory: "Clear All Records",
    lowConfidenceWarn: "Low diagnostic clarity. Please ensure the leaf lesion is well-lit, centered, and in sharp focus.",
    healthyCropMsg: "No active disease detected. The leaf exhibits robust, healthy tissue characteristics.",
    emergencyAction: "Immediate Action Protocol"
  },
  hi: {
    appName: "क्रॉप-डॉक",
    tagline: "पादप रोग विज्ञान एवं कृषि मौसम सलाहकार",
    installApp: "ऐप इंस्टॉल करें",
    appInstalled: "ऐप इंस्टॉल है",
    scanCrop: "फसल जांचें",
    weatherAdvisory: "खेत का मौसम",
    scanHistory: "सुरक्षित रिकॉर्ड",
    heroHeading: "फसल रोग पहचान एवं उपचार",
    heroSubtitle: "रोगग्रस्त पत्ते की फोटो खींचें और पाएं प्रमाणित जैविक उपाय, रासायनिक उपचार तथा स्थानीय मौसम अनुसार सुरक्षित छिड़काव की सलाह।",
    snapPhoto: "कैमरा खोलें",
    uploadPhoto: "गैलरी से चुनें",
    dragDrop: "पत्ते की फोटो यहाँ रखें या चुनने के लिए क्लिक करें",
    dropToUpload: "जांच शुरू करने के लिए फोटो छोड़ें",
    analyzingLeaf: "पत्ते का परीक्षण हो रहा है...",
    runningVision: "38 पादप रोगों के आधार पर वैज्ञानिक विश्लेषण जारी है",
    diagnosisResult: "रोग निदान एवं उपचार पर्ची",
    confidence: "सटीकता दर",
    pathogen: "रोगजनक / जीवाणु",
    severity: "गंभीरता",
    listenRemedies: "उपाय सुनें",
    stopAudio: "आवाज रोकें",
    organicTab: "जैविक उपचार",
    chemicalTab: "रासायनिक उपचार",
    preventiveTab: "बचाव एवं सावधानियां",
    weatherTab: "मौसम प्रभाव",
    aiAdvisoryTab: "विशेषज्ञ सलाह",
    noChemicalsNeeded: "पत्ता पूर्णतः स्वस्थ है! किसी कीटनाशक या दवा के छिड़काव की आवश्यकता नहीं है।",
    weatherRisk: "रोग फैलने का खतरा",
    sprayingWindow: "छिड़काव की स्थिति",
    safeToSpray: "छिड़काव के लिए अनुकूल समय",
    dangerToSpray: "छिड़काव के लिए प्रतिकूल समय",
    temperature: "तापमान",
    humidity: "हवा में नमी",
    windSpeed: "हवा की गति",
    rainfall: "वर्षा की मात्रा",
    fetchingWeather: "मौसम की स्थिति प्राप्त की जा रही है...",
    useMyLocation: "खेत की लोकेशन चुनें",
    locationDenied: "लोकेशन नहीं मिली। कृपया शहर के नाम से खोजें।",
    searchCity: "शहर या जिले का नाम दर्ज करें...",
    searchBtn: "खोजें",
    topCandidates: "अन्य संभावित रोग",
    retakePhoto: "अन्य पत्ते की जांच करें",
    saveDiagnosis: "सुरक्षित करें",
    savedLocally: "ऑफलाइन सुरक्षित",
    noSavedScans: "इस फोन पर कोई पिछला रिकॉर्ड नहीं है।",
    clearHistory: "सभी रिकॉर्ड हटाएं",
    lowConfidenceWarn: "फोटो स्पष्ट नहीं है। कृपया पत्ते को अच्छी रोशनी में केंद्रित रख कर पुनः फोटो लें।",
    healthyCropMsg: "शुभ समाचार! पत्ते में किसी भी बीमारी के लक्षण नहीं पाए गए हैं।",
    emergencyAction: "तत्काल आवश्यक कदम"
  }
};

import { Language } from "@/types";

export interface TranslationDict {
  appName: string;
  tagline: string;
  installApp: string;
  appInstalled: string;
  scanCrop: string;
  mandiTab: string;
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
  cropImage: string;
  cropInstructions: string;
  applyCrop: string;
  cancelCrop: string;
  tankiDosage: string;
  acreDosage: string;
  estCost: string;
  phiDays: string;
  shareWhatsApp: string;
  fieldOfflineMode: string;
  validationBlurry: string;
  validationNonLeaf: string;
  mandiHeading: string;
  mandiSubtitle: string;
  selectState: string;
  selectDistrict: string;
  selectCrop: string;
  allOption: string;
  modalPrice: string;
  priceRange: string;
  arrivals: string;
  nearbyMandis: string;
  noMandiResults: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: "CropDoc",
    tagline: "Plant Pathology & Field Advisory",
    installApp: "Install App",
    appInstalled: "App Installed",
    scanCrop: "Diagnose Leaf",
    mandiTab: "Mandi Prices",
    weatherAdvisory: "Field Weather",
    scanHistory: "Saved Scans",
    heroHeading: "Plant Pathology & Crop Health",
    heroSubtitle: "Capture a photo of a symptomatic leaf for immediate pathology identification, CIBRC 15L backpack sprayer prescriptions, and local APMC market intelligence.",
    snapPhoto: "Take Photo",
    uploadPhoto: "Choose from Gallery",
    dragDrop: "Drag & drop a leaf photo here, or click to browse",
    dropToUpload: "Release image to begin analysis",
    analyzingLeaf: "Inspecting leaf tissue...",
    runningVision: "Evaluating symptoms across 62 Indian & benchmark pathologies",
    diagnosisResult: "Clinical Diagnosis & Prescription",
    confidence: "Diagnostic Certainty",
    pathogen: "Causal Pathogen",
    severity: "Severity Level",
    listenRemedies: "Listen to Prescription (Audio)",
    stopAudio: "Stop Audio",
    organicTab: "Biological & Bio-Control",
    chemicalTab: "CIBRC Chemical Control",
    preventiveTab: "Cultural Prevention",
    weatherTab: "Environmental Triggers",
    aiAdvisoryTab: "Kisan Agronomic Plan",
    noChemicalsNeeded: "Foliage is healthy! No chemical fungicides or treatments required.",
    weatherRisk: "Spore Outbreak Risk",
    sprayingWindow: "Spraying Advisory Window",
    safeToSpray: "Optimal for Spraying",
    dangerToSpray: "Unfavorable for Spraying",
    temperature: "Temperature",
    humidity: "Relative Humidity",
    windSpeed: "Wind Speed",
    rainfall: "Precipitation",
    fetchingWeather: "Retrieving local meteorological telemetry...",
    useMyLocation: "Locate My Farm",
    locationDenied: "Location permission denied. Search by agricultural district.",
    searchCity: "Enter city or agricultural district...",
    searchBtn: "Search",
    topCandidates: "Differential Diagnosis (Alternative Possibilities)",
    retakePhoto: "Diagnose Another Leaf",
    saveDiagnosis: "Save to Device",
    savedLocally: "Saved to Offline Records",
    noSavedScans: "No diagnostic reports saved yet. Completed diagnoses can be saved locally for field review.",
    clearHistory: "Clear All Saved Scans",
    lowConfidenceWarn: "Sub-optimal certainty. Please inspect alternative candidates below or consult your local KVK extension officer.",
    healthyCropMsg: "Plant foliage appears vibrant and healthy. Continue regular field scouting and organic nutrition.",
    emergencyAction: "Immediate Spray (15L Tank / ढोलकी)",
    cropImage: "Crop & Frame Leaf",
    cropInstructions: "Drag box to isolate infected leaf lesions",
    applyCrop: "Confirm & Diagnose",
    cancelCrop: "Use Full Photo",
    tankiDosage: "Dosage per 15L Knapsack Tank (ढोलकी)",
    acreDosage: "Per Acre Requirement",
    estCost: "Est. Treatment Cost",
    phiDays: "Safe Harvest Wait (PHI)",
    shareWhatsApp: "WhatsApp Prescription",
    fieldOfflineMode: "Field Offline Mode (Regional Seasonal Averages)",
    validationBlurry: "Photo is blurry. Please hold camera steady and tap screen to focus on the leaf.",
    validationNonLeaf: "No crop leaf detected in this photo. Please capture a clear view of the plant leaf.",
    mandiHeading: "APMC Mandi Market Prices",
    mandiSubtitle: "Live & cached commodity arrivals, modal prices (₹/Quintal), and nearby mandi comparison.",
    selectState: "State",
    selectDistrict: "District",
    selectCrop: "Crop",
    allOption: "All",
    modalPrice: "Modal Price",
    priceRange: "Price Range",
    arrivals: "Daily Arrivals",
    nearbyMandis: "Nearby Market Rates",
    noMandiResults: "No APMC market records found for the selected combination."
  },
  hi: {
    appName: "क्रॉपडॉक (CropDoc)",
    tagline: "फसल रोग निदान एवं किसान सलाह",
    installApp: "ऐप इंस्टॉल करें",
    appInstalled: "ऐप इंस्टॉल है",
    scanCrop: "रोग जांचें",
    mandiTab: "मंडी भाव",
    weatherAdvisory: "खेत का मौसम",
    scanHistory: "सहेजे गए पर्चे",
    heroHeading: "पौध रोग निदान एवं फसल सुरक्षा",
    heroSubtitle: "बीमार पत्ती की फोटो खींचें और तुरंत रोग पहचान, 15 लीटर ढोलकी पंप हेतु अनुशंसित दवा की मात्रा एवं मंडी भाव प्राप्त करें।",
    snapPhoto: "फोटो खींचें",
    uploadPhoto: "गैलरी से चुनें",
    dragDrop: "पत्ती की फोटो यहां खींचें या चुनने के लिए क्लिक करें",
    dropToUpload: "जांच शुरू करने के लिए फोटो छोड़ें",
    analyzingLeaf: "पत्ती की जांच हो रही है...",
    runningVision: "62 प्रमुख फसलों एवं रोगों के डेटाबेस से मिलान किया जा रहा है",
    diagnosisResult: "जांच रिपोर्ट एवं उपचार पर्चा",
    confidence: "सटीकता",
    pathogen: "रोग कारक (पैथोजन)",
    severity: "गंभीरता",
    listenRemedies: "दवा का पर्चा सुनें (ऑडियो)",
    stopAudio: "ऑडियो रोकें",
    organicTab: "जैविक एवं देसी उपचार",
    chemicalTab: "सरकारी प्रमाणित कीटनाशक/दवा",
    preventiveTab: "बचाव के उपाय",
    weatherTab: "मौसम व रोग ट्रिगर",
    aiAdvisoryTab: "कृषि वैज्ञानिक सलाह",
    noChemicalsNeeded: "फसल बिल्कुल स्वस्थ है! किसी भी रासायनिक दवा की आवश्यकता नहीं है।",
    weatherRisk: "फफूंद / रोग फैलने का जोखिम",
    sprayingWindow: "दवा छिड़काव का सही समय",
    safeToSpray: "छिड़काव के लिए मौसम उत्तम है",
    dangerToSpray: "अभी छिड़काव न करें (असुरक्षित)",
    temperature: "तापमान",
    humidity: "हवा में नमी (आर्द्रता)",
    windSpeed: "हवा की गति",
    rainfall: "बारिश",
    fetchingWeather: "स्थानीय मौसम की जानकारी प्राप्त की जा रही है...",
    useMyLocation: "मेरा खेत खोजें (GPS)",
    locationDenied: "लोकेशन की अनुमति नहीं मिली। अपने ज़िले का नाम लिखकर खोजें।",
    searchCity: "ज़िले या शहर का नाम लिखें...",
    searchBtn: "खोजें",
    topCandidates: "अन्य संभावित रोग",
    retakePhoto: "दूसरी पत्ती जांचें",
    saveDiagnosis: "मोबाइल में सहेजें",
    savedLocally: "ऑफलाइन रिकॉर्ड में सहेजा गया",
    noSavedScans: "अभी कोई जांच रिपोर्ट सहेजी नहीं गई है।",
    clearHistory: "सभी पुराने पर्चे हटाएं",
    lowConfidenceWarn: "रोग की पहचान में अनिश्चितता है। कृपया नीचे दिए गए अन्य विकल्पों को देखें या कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
    healthyCropMsg: "फसल की पत्ती हरी और स्वस्थ है। नियमित निगरानी रखें और जैविक खाद देते रहें।",
    emergencyAction: "आपातकालीन छिड़काव (15 लीटर ढोलकी)",
    cropImage: "पत्ती को क्रॉप करें",
    cropInstructions: "बीमार पत्ती के हिस्से को चौकोर बॉक्स में लाएं",
    applyCrop: "क्रॉप करें और जांचें",
    cancelCrop: "पूरी फोटो का उपयोग करें",
    tankiDosage: "15 लीटर स्प्रे पंप (ढोलकी) में मात्रा",
    acreDosage: "प्रति एकड़ आवश्यक मात्रा",
    estCost: "अनुमानित खर्च",
    phiDays: "कटाई प्रतीक्षा समय (PHI दिन)",
    shareWhatsApp: "व्हाट्सएप पर पर्चा भेजें",
    fieldOfflineMode: "खेत ऑफलाइन मोड (क्षेत्रीय मौसमी औसत)",
    validationBlurry: "फोटो बहुत धुंधली है। फोन को स्थिर रखें और पत्ती पर टैप करके फोकस करें।",
    validationNonLeaf: "इस फोटो में कोई पत्ती नहीं दिख रही। कृपया फसल की पत्ती की साफ़ फोटो खींचें।",
    mandiHeading: "कृषि उपज मंडी भाव (APMC)",
    mandiSubtitle: "दैनिक आवक, मॉडल भाव (₹/क्विंटल) एवं आसपास की मंडियों की तुलना।",
    selectState: "राज्य चुनें",
    selectDistrict: "ज़िला चुनें",
    selectCrop: "फसल चुनें",
    allOption: "सभी",
    modalPrice: "मॉडल भाव",
    priceRange: "न्यूनतम - अधिकतम भाव",
    arrivals: "दैनिक आवक",
    nearbyMandis: "आसपास की मंडियों के भाव",
    noMandiResults: "चुने गए विकल्पों के लिए कोई मंडी रिकॉर्ड उपलब्ध नहीं है।"
  }
};

# CropDoc 🌾🔬 — Indian Agricultural Health & Mandi Intelligence

**CropDoc** is an end-to-end agricultural health platform and Progressive Web App (PWA) tailored for Indian smallholders and farmers. It unites a **3-Stage Hierarchical Vision Pipeline** with **CIBRC-approved remedies calibrated for 15L backpack sprayers (ढोलकी)**, **APMC Mandi commodity price intelligence**, **resilient offline seasonal agro-weather fallbacks**, and **low-literacy visual audio guidance**.

---

## 🌟 Key Real-World Features

* **Expanded 62-Class Agricultural Pathology Taxonomy**:
  * **Indian Staples & Cash Crops**:
    * **Paddy / Rice**: Leaf Blast (*Magnaporthe oryzae*), Bacterial Leaf Blight (*Xanthomonas oryzae*), Brown Spot (*Bipolaris oryzae*), Healthy
    * **Wheat**: Yellow / Stripe Rust (*Puccinia striiformis*), Brown Leaf Rust (*Puccinia triticina*), Powdery Mildew, Healthy
    * **Cotton**: Bacterial Blight / Blackarm (*Xanthomonas*), Cotton Leaf Curl Virus (CLCuV), Bollworm damage, Healthy
    * **Sugarcane**: Red Rot (*Colletotrichum falcatum*), Sugarcane Rust, Healthy
    * **Mustard**: White Rust / Blister (*Albugo candida*), Alternaria Leaf Blight, Healthy
    * **Chilli**: Chilli Leaf Curl Virus / Murda Rog, Anthracnose Fruit Rot & Dieback, Healthy
    * **Onion**: Purple Blotch (*Alternaria porri*), Stemphylium Leaf Blight, Healthy
  * **Benchmark Horticultural Classes**: Apple, Tomato, Potato, Bell Pepper, Corn, Grape, Peach, Orange, Strawberry, Squash.

* **Hierarchical 3-Stage Field Diagnostic Pipeline**:
  1. *Stage 1 (Fast CV Pre-filter, <50ms)*: Checks foliar green/chlorophyll chroma and Laplacian variance (blur detection) to reject non-plant objects (shoes, walls, hands, soil) and blurry shots with clear pictorial alerts and audio prompts.
  2. *Stage 2 (Deep Pathology Classifier)*: High-throughput deep computer vision with calibrated confidence scoring.
  3. *Stage 3 (Multimodal Gemini 2.5 Flash Vision Fallback)*: Activates for complex field photos (farmer hands holding leaf, ambiguous lesions, dual symptoms) for zero-shot clinical precision.

* **In-App Touch-Friendly Leaf Cropper**:
  * Native `<dialog:modal>` canvas cropper with 1:1 lesion framing, smooth pinch/slider zoom, and pan controls so farmers can isolate infected leaf areas from noisy field backgrounds.

* **Indian CIBRC Agronomic Prescription Engine**:
  * **Standard 15L Knapsack Sprayer (*Tanki* / *Dholki*) Metric**: Prescriptions explicitly state exact dose per 15-litre backpack sprayer (e.g. *35g Saaf / 15ml Tilt per 15L tank*) and per acre.
  * **Commercial Trade Formulations**: Saaf, Bavistin, Confidor, Blitox, Tilt, Amistar Top, Ridomil Gold, Pegasus.
  * **Certified Organic / Bio-control Alternatives**: Neem Oil 10,000 PPM (Azadirachtin), *Trichoderma viride*, *Pseudomonas fluorescens*, Jeevamrut.
  * **Economic Transparency**: Estimated treatment cost in Indian Rupees (₹) per tank and per acre.
  * **Pre-Harvest Interval (PHI)**: Clear safety waiting days before harvesting.

* **APMC Mandi Commodity Market Tracker**:
  * Live and cached market prices (Min, Max, and Modal Price in ₹/Quintal) across key agricultural states (Punjab, Maharashtra, UP, MP, Gujarat, Rajasthan, AP/Telangana).
  * Daily arrival volumes (tonnes), price trend badges (▲/▼/▬), MSP benchmarks, and nearby mandi rate comparisons.

* **Hybrid Agro-Weather & Spraying Advisory**:
  * Connects to live OpenWeatherMap telemetry when in town, but automatically transitions to **Field Offline Mode** (regional seasonal agro-climatic baselines) when working in deep fields with zero network.
  * Color-coded **Spraying Window Advisory** indicating ideal morning (7:00-10:30 AM) and evening application hours based on wind drift and precipitation risk.

* **Low-Literacy & Hands-Free Field UX**:
  * Simplified color-coded severity gauge: 🟢 Healthy (हरा - सुरक्षित), 🟡 Moderate (पीला - सावधानी), 🔴 Severe (लाल - तुरंत छिड़काव).
  * Bilingual i18n support in English and Hindi (हिन्दी).
  * Web Speech API text-to-speech audio reader.
  * One-tap WhatsApp **Kisan Prescription Slip** exporter to show at the local *Krishi Seva Kendra*.

---

## 🏗️ System Architecture

```text
CropDoc/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── diagnose.py        # 3-Stage hierarchical leaf diagnosis endpoint
│   │   │   ├── mandi.py           # APMC Mandi commodity rates & arrivals
│   │   │   └── weather.py         # OpenWeatherMap & regional seasonal fallback
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings (.env configuration)
│   │   │   └── advisory.py        # CIBRC remedies & optional Gemini AI enrichment
│   │   ├── data/
│   │   │   └── remedies.json      # 62-class CIBRC remedies & 15L tanki dosages
│   │   ├── ml/
│   │   │   ├── labels.py          # 62 pathology classes & Hindi names dictionary
│   │   │   ├── validator.py       # Stage 1 Fast CV leaf & blur filter (<50ms)
│   │   │   ├── model.py           # Hierarchical model runner & Multimodal Gemini
│   │   │   ├── train.py           # PyTorch local training pipeline
│   │   │   └── download_data.py   # Dataset downloader
│   │   ├── services/
│   │   │   ├── mandi.py           # APMC Mandi database and query engine
│   │   │   └── weather.py         # Agro-risks & resilient fallback service
│   │   └── main.py                # FastAPI application
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── icons/                 # PWA adaptive SVG icons
│   │   └── sw.js                  # PWA service worker
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Responsive PWA shell & metadata
│   │   │   └── page.tsx           # Scanner, Mandi Bhav, Weather & History dashboard
│   │   ├── components/            # UI components (21st.dev craft standards)
│   │   │   ├── DiagnosisCard.tsx  # Severity gauge, audio reader & 15L tanki callout
│   │   │   ├── ImageCropperModal.tsx # Touch-friendly 1:1 leaf lesion cropper
│   │   │   ├── ImageUploader.tsx  # Camera shutter & Stage 1 validation warning
│   │   │   ├── MandiTracker.tsx   # APMC Mandi prices, arrivals & trends
│   │   │   ├── Navbar.tsx         # Navigation, language switch & status pill
│   │   │   ├── ScanHistoryView.tsx# Offline scans viewer
│   │   │   └── WeatherCard.tsx    # Spraying window & Field Offline Mode banner
│   │   ├── lib/
│   │   │   ├── api.ts             # Typed API client
│   │   │   ├── i18n.ts            # English & Hindi translation dictionaries
│   │   │   └── storage.ts         # LocalStorage offline scan persistence
│   │   └── types/                 # Strict TypeScript interfaces
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Python 3.10+** (PyTorch 2.6+ with CUDA recommended)
* **Node.js 18+** & **npm**

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(Optional: Add `OPENWEATHER_API_KEY` for live weather forecasts, or `GEMINI_API_KEY` for dynamic AI advisory & Stage 3 multimodal fallback).*
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Interactive API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   * System health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 3. Frontend (PWA) Setup
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your mobile or desktop browser.

---

## 🔒 Security & Credential Hygiene
All API keys strictly reside in `.env` or `.env.local` files and are excluded by `.gitignore`. Template placeholders are documented in `.env.example`.

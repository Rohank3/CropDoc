# CropDoc 🌾🔬

**CropDoc** is an end-to-end, zero-mock agricultural health platform and Progressive Web App (PWA) designed for farmers. It combines PyTorch deep learning computer vision with scientifically verified agronomic treatments, live agro-meteorological forecasting, and offline mobile resilience.

---

## 🌟 Key Features

* **Real Computer Vision Diagnostics**: Identifies 38 distinct crop disease and healthy states across Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato.
* **Dual Model Strategy**:
  1. *Production Ready*: Pre-trained `MobileNetV2` fine-tuned on the 38-class PlantVillage pathology benchmark with GPU (CUDA) acceleration.
  2. *Custom Training Pipeline*: Standalone PyTorch training pipeline (`train.py`) with data augmentations, cosine annealing, and ONNX export to train on your local GPU.
* **Verified Agronomic Knowledge Graph**: Curated organic bio-pesticides (Neem oil, *Bacillus subtilis*, *Trichoderma*), chemical controls with application dosages and withholding periods, and cultural prevention protocols.
* **Agro-Meteorological Telemetry (OpenWeatherMap)**: Real-time temperature, humidity, rainfall, and wind telemetry with automated **Fungal Disease Outbreak Risk** calculations and **Spraying Window Advisories**.
* **Progressive Web App (PWA)**:
  * Mobile-first responsive UI built according to 21st.dev craft standards.
  * Direct device camera shutter (`capture="environment"`) with client-side canvas compression for 2G/3G connectivity.
  * Web App Manifest & Service Worker for home-screen installation.
  * Bilingual i18n support (English & हिन्दी).
  * Audio text-to-speech reader for hands-free prescription listening in the field.
  * Offline scan history stored locally on the phone (IndexedDB / LocalStorage).
* **Zero Mock Guarantee**: All outputs are generated from real vision models, genuine OpenWeatherMap telemetry, and vetted botanical extension records.

---

## 🏗️ System Architecture

```text
CropDoc/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── diagnose.py        # Image pathology diagnosis endpoint
│   │   │   └── weather.py         # OpenWeatherMap & agro-risk calculator
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings (.env configuration)
│   │   │   └── advisory.py        # Knowledge base & optional Gemini AI enrichment
│   │   ├── data/
│   │   │   └── remedies.json      # Curated treatments for all 38 classes
│   │   ├── ml/
│   │   │   ├── labels.py          # 38 pathology classes & metadata parser
│   │   │   ├── model.py           # Model loader & PyTorch/HF inference
│   │   │   ├── train.py           # PyTorch local training pipeline
│   │   │   └── download_data.py   # Dataset downloader
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
│   │   │   └── page.tsx           # Home, Scanner, Weather & History dashboard
│   │   ├── components/            # UI components (21st.dev patterns)
│   │   │   ├── DiagnosisCard.tsx  # Diagnosis, audio reader & remedy tabs
│   │   │   ├── ImageUploader.tsx  # Camera shutter & canvas compression
│   │   │   ├── InstallBanner.tsx  # PWA install banner
│   │   │   ├── Navbar.tsx         # Navigation, language switch & GPU pill
│   │   │   ├── ScanHistoryView.tsx# Offline scans viewer
│   │   │   └── WeatherCard.tsx    # Agro-weather & fungal risk dashboard
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
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(Optional: Add your `OPENWEATHER_API_KEY` in `.env` to enable live weather forecasts, or `GEMINI_API_KEY` for dynamic AI advisory).*
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

## 🧠 Training Your Own Custom PyTorch Model Locally

To train or fine-tune the crop disease model on your laptop GPU:

1. **Acquire the PlantVillage Dataset**:
   ```bash
   cd backend
   python app/ml/download_data.py --dest ./data/plantvillage
   ```
2. **Execute the Training Pipeline**:
   ```bash
   python app/ml/train.py --data-dir ./data/plantvillage --epochs 15 --batch-size 32 --device cuda
   ```
   * Automatically trains with data augmentations, cosine annealing, and evaluation.
   * Saves the best checkpoint to `models/cropdoc_mobilenetv2.pth`.
   * Automatically exports an optimized ONNX version to `models/cropdoc_mobilenetv2.onnx`.

---

## 🔒 Security & Credential Hygiene
All API keys strictly reside in `.env` or `.env.local` files and are excluded by `.gitignore`. Template placeholders are documented in `.env.example`.

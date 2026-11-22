import json
import os

REMEDIES_FILE = os.path.join("backend", "app", "data", "remedies.json")

with open(REMEDIES_FILE, "r", encoding="utf-8") as f:
    existing_data = json.load(f)

# Helper function to enrich existing entries
def enrich_existing(k, v):
    is_healthy = "healthy" in k.lower()
    crop = v.get("crop", k.split("___")[0])
    disease = v.get("disease", k.split("___")[1].replace("_", " "))
    
    if is_healthy:
        severity = "Low"
        severity_gauge = "green"
        tanki_quick_dose = "No chemical needed. Crop leaf is healthy!"
        cibrc_chemical = []
        cibrc_organic = [
            {
                "name": "Neem Oil 10,000 PPM (Preventive maintenance)",
                "dose_per_tank_15l": "30-35 ml per 15L tank",
                "dose_per_acre": "400-500 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Optional routine preventive bio-spray to keep foliage pest-free."
            }
        ]
    else:
        orig_sev = v.get("severity", "Medium")
        if orig_sev.lower() in ["high", "critical"]:
            severity_gauge = "red"
        elif orig_sev.lower() in ["medium", "moderate"]:
            severity_gauge = "yellow"
        else:
            severity_gauge = "green"
        severity = orig_sev

        # Generic sensible CIBRC enrichments based on pathology type
        is_bacterial = "bacterial" in k.lower() or "bacterial" in v.get("pathogen", "").lower()
        is_virus = "virus" in k.lower() or "curl" in k.lower() or "mosaic" in k.lower()
        is_mite = "mite" in k.lower() or "spider" in k.lower()

        if is_bacterial:
            cibrc_chemical = [
                {
                    "name": "Copper Oxychloride 50% WP (Blitox / Blue Copper)",
                    "dose_per_tank_15l": "35-40 g per 15L tank",
                    "dose_per_acre": "500-600 g in 200L water",
                    "est_cost_inr": "₹55 - ₹75 per tank (₹350/acre)",
                    "phi_days": 10,
                    "application_notes": "Mix thoroughly. Spray during morning hours on foliage."
                },
                {
                    "name": "Streptocycline 90% + Tetracycline 10% SP",
                    "dose_per_tank_15l": "1.5 - 2.0 g per 15L tank",
                    "dose_per_acre": "20-25 g in 200L water",
                    "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                    "phi_days": 14,
                    "application_notes": "Mix with Copper Oxychloride for synergistic antibacterial control."
                }
            ]
            cibrc_organic = [
                {
                    "name": "Pseudomonas fluorescens 1.5% WP",
                    "dose_per_tank_15l": "45-50 g per 15L tank",
                    "dose_per_acre": "1.0 kg in 200L water",
                    "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                    "phi_days": 0,
                    "application_notes": "Foliar bio-agent spray that competes against pathogenic bacteria."
                }
            ]
            tanki_quick_dose = "Blitox 35g + Streptocycline 2g per 15L Tank (ढोलकी)"
        elif is_virus:
            cibrc_chemical = [
                {
                    "name": "Imidacloprid 17.8% SL (Confidor / Victor) for Vector Control",
                    "dose_per_tank_15l": "5 - 7 ml per 15L tank",
                    "dose_per_acre": "60-80 ml in 200L water",
                    "est_cost_inr": "₹40 - ₹60 per tank (₹300/acre)",
                    "phi_days": 14,
                    "application_notes": "Direct spray at sap-sucking whitefly vectors transmitting the virus."
                },
                {
                    "name": "Diafenthiuron 50% WP (Pegasus)",
                    "dose_per_tank_15l": "15-18 g per 15L tank",
                    "dose_per_acre": "250 g in 200L water",
                    "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                    "phi_days": 21,
                    "application_notes": "Controls both nymph and adult whiteflies and thrips."
                }
            ]
            cibrc_organic = [
                {
                    "name": "Neem Oil 10,000 PPM (Azadirachtin)",
                    "dose_per_tank_15l": "40-45 ml per 15L tank",
                    "dose_per_acre": "500-600 ml in 200L water",
                    "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                    "phi_days": 0,
                    "application_notes": "Anti-feedant and repellent against viral vector insects."
                }
            ]
            tanki_quick_dose = "Confidor 6ml OR Neem Oil 45ml per 15L Tank (ढोलकी)"
        elif is_mite:
            cibrc_chemical = [
                {
                    "name": "Spiromesifen 22.9% SC (Oberon)",
                    "dose_per_tank_15l": "15 ml per 15L tank",
                    "dose_per_acre": "200 ml in 200L water",
                    "est_cost_inr": "₹60 - ₹85 per tank (₹400/acre)",
                    "phi_days": 7,
                    "application_notes": "Target lower surface of leaves where red spider mites colony feeds."
                },
                {
                    "name": "Wettable Sulphur 80% WDG (Sulfex)",
                    "dose_per_tank_15l": "35-40 g per 15L tank",
                    "dose_per_acre": "500 g in 200L water",
                    "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                    "phi_days": 5,
                    "application_notes": "Contact miticide and fungicide. Avoid spraying in extreme midday heat."
                }
            ]
            cibrc_organic = [
                {
                    "name": "Neem Oil 10,000 PPM + Cow Urine Extract",
                    "dose_per_tank_15l": "45-50 ml per 15L tank",
                    "dose_per_acre": "600 ml in 200L water",
                    "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                    "phi_days": 0,
                    "application_notes": "Natural suffocant and ovicide for mite eggs."
                }
            ]
            tanki_quick_dose = "Oberon 15ml OR Sulfex 40g per 15L Tank (ढोलकी)"
        else: # Fungal default
            cibrc_chemical = [
                {
                    "name": "Carbendazim 12% + Mancozeb 63% WP (Saaf / Sixer)",
                    "dose_per_tank_15l": "30-35 g per 15L tank",
                    "dose_per_acre": "500 g in 200L water",
                    "est_cost_inr": "₹45 - ₹65 per tank (₹350/acre)",
                    "phi_days": 14,
                    "application_notes": "Systemic + contact protective and curative spray."
                },
                {
                    "name": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top)",
                    "dose_per_tank_15l": "15 ml per 15L tank",
                    "dose_per_acre": "200 ml in 200L water",
                    "est_cost_inr": "₹85 - ₹110 per tank (₹650/acre)",
                    "phi_days": 10,
                    "application_notes": "Advanced broad-spectrum curative fungicide for severe blight/rust."
                }
            ]
            cibrc_organic = [
                {
                    "name": "Trichoderma viride 1% WP",
                    "dose_per_tank_15l": "45-50 g per 15L tank",
                    "dose_per_acre": "1.0 kg in 200L water",
                    "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                    "phi_days": 0,
                    "application_notes": "Bio-fungicide antagonizing fungal mycelium and spore germination."
                },
                {
                    "name": "Neem Oil 10,000 PPM (Azadirachtin)",
                    "dose_per_tank_15l": "40-45 ml per 15L tank",
                    "dose_per_acre": "500 ml in 200L water",
                    "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                    "phi_days": 0,
                    "application_notes": "Organic protective coating preventing spore adherence."
                }
            ]
            tanki_quick_dose = "Saaf 30g OR Amistar Top 15ml per 15L Tank (ढोलकी)"

    v["cibrc_chemical"] = cibrc_chemical
    v["cibrc_organic"] = cibrc_organic
    v["severity_gauge"] = severity_gauge
    v["tanki_quick_dose"] = tanki_quick_dose
    return v

# Enrich existing 38 classes
for k in existing_data:
    existing_data[k] = enrich_existing(k, existing_data[k])

# 24 New Major Indian Crop Classes
indian_crops_data = {
    # Rice
    "Rice___Leaf_Blast": {
        "crop": "Rice",
        "disease": "Leaf Blast",
        "pathogen": "Magnaporthe oryzae (Pyricularia oryzae) - Fungus",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Spindle-shaped or eye-shaped lesions with grayish center and brown/reddish margin on leaf blades.",
        "symptoms_hi": "पत्तियों पर आंख या धुरी के आकार के धब्बे, जिनका केंद्र भूरा/धूसर और किनारे लाल-भूरे होते हैं।",
        "cibrc_chemical": [
            {
                "name": "Tricyclazole 75% WP (Baan / Beam)",
                "dose_per_tank_15l": "12-15 g per 15L tank",
                "dose_per_acre": "120-150 g in 200L water",
                "est_cost_inr": "₹60 - ₹85 per tank (₹450/acre)",
                "phi_days": 21,
                "application_notes": "Spray immediately at first appearance of spindle lesions. Repeat after 10-12 days if humid."
            },
            {
                "name": "Isoprothiolane 40% EC (Fuji-One)",
                "dose_per_tank_15l": "30 ml per 15L tank",
                "dose_per_acre": "300 ml in 200L water",
                "est_cost_inr": "₹70 - ₹95 per tank (₹500/acre)",
                "phi_days": 15,
                "application_notes": "Systemic blast cure; also prevents neck blast infection."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Pseudomonas fluorescens 1.5% WP",
                "dose_per_tank_15l": "40-50 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Foliar spray during early morning or evening hours."
            },
            {
                "name": "Neem Oil 10,000 PPM (Azadirachtin)",
                "dose_per_tank_15l": "40-45 ml per 15L tank",
                "dose_per_acre": "500 ml in 200L water",
                "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                "phi_days": 0,
                "application_notes": "Organic protective coating preventing spore adherence."
            }
        ],
        "organic_remedies": [
            "Foliar spray with Pseudomonas fluorescens 1.5% WP (40-50g / 15L tank).",
            "Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil 10,000 PPM (45ml / 15L tank).",
            "Avoid excess nitrogen fertilizer (Urea); apply Potash to strengthen leaf cuticle."
        ],
        "chemical_remedies": [
            "Spray Tricyclazole 75% WP @ 12-15 g per 15L backpack tank (120 g/acre).",
            "Spray Isoprothiolane 40% EC @ 30 ml per 15L backpack tank (300 ml/acre).",
            "Spray Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 30-35 g per 15L tank."
        ],
        "preventive_practices": [
            "Treat seeds before sowing with Trichoderma viride @ 5g/kg or Carbendazim @ 2g/kg.",
            "Do not apply excessive split doses of Urea under humid cloudy weather.",
            "Maintain clean field bunds and destroy wild grass hosts around paddy nursery."
        ],
        "tanki_quick_dose": "Tricyclazole 15g OR Saaf 30g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "20°C - 26°C",
            "humidity_threshold": "> 90%",
            "leaf_wetness_hours": "Dew or leaf wetness > 10 hours with cloudy days"
        }
    },
    "Rice___Bacterial_Blight": {
        "crop": "Rice",
        "disease": "Bacterial Blight",
        "pathogen": "Xanthomonas oryzae pv. oryzae - Bacteria",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Water-soaked stripes turning yellow-to-white wavy lesions along leaf margins from tip downward.",
        "symptoms_hi": "पत्ती के किनारों पर नोक से नीचे की ओर पीले से सफेद रंग की लहरदार सूखी धारियां।",
        "cibrc_chemical": [
            {
                "name": "Copper Hydroxide 53.8% DF (Kocide) + Streptocycline",
                "dose_per_tank_15l": "30 g Kocide + 2 g Streptocycline per 15L tank",
                "dose_per_acre": "400 g + 25 g in 200L water",
                "est_cost_inr": "₹75 - ₹95 per tank (₹550/acre)",
                "phi_days": 14,
                "application_notes": "Spray upon noticing leaf tip yellowing. Do not drain field water into adjoining healthy plots."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Pseudomonas fluorescens 1.5% WP",
                "dose_per_tank_15l": "50 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Bio-agent colonizes leaf surface and prevents bacteria multiplying."
            }
        ],
        "organic_remedies": [
            "Spray fresh Cow Dung water extract (20% filtrate) on foliage.",
            "Foliar application of Pseudomonas fluorescens at 50g per 15L tank.",
            "Withhold nitrogen fertilization during active bacterial lesion expansion."
        ],
        "chemical_remedies": [
            "Spray Streptocycline @ 2g + Copper Oxychloride @ 35g per 15L tank.",
            "Apply Copper Hydroxide 53.8% DF @ 30g per 15L tank."
        ],
        "preventive_practices": [
            "Use certified BLB-resistant varieties (e.g. Improved Samba Mahsuri, PR 126).",
            "Avoid deep standing water in nursery beds."
        ],
        "tanki_quick_dose": "Streptocycline 2g + Blitox 35g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "25°C - 34°C",
            "humidity_threshold": "> 85%",
            "leaf_wetness_hours": "Heavy monsoon rains and strong winds causing leaf abrasion"
        }
    },
    "Rice___Brown_Spot": {
        "crop": "Rice",
        "disease": "Brown Spot",
        "pathogen": "Bipolaris oryzae (Cochliobolus miyabeanus) - Fungus",
        "severity": "Medium",
        "severity_gauge": "yellow",
        "symptoms": "Oval or circular brown lesions with yellow halo evenly scattered across paddy leaf blade.",
        "symptoms_hi": "धान की पत्तियों पर पीले छल्ले वाले छोटे अंडाकार भूरे धब्बे।",
        "cibrc_chemical": [
            {
                "name": "Mancozeb 75% WP (Dithane M-45)",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500-600 g in 200L water",
                "est_cost_inr": "₹40 - ₹60 per tank (₹300/acre)",
                "phi_days": 15,
                "application_notes": "Broad-spectrum contact protective spray across entire canopy."
            },
            {
                "name": "Propiconazole 25% EC (Tilt)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                "phi_days": 21,
                "application_notes": "Systemic triazole fungicide arresting fungal hyphae."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma harzianum 1% WP",
                "dose_per_tank_15l": "40-45 g per 15L tank",
                "dose_per_acre": "800 g in 200L water",
                "est_cost_inr": "₹25 - ₹35 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Suppresses seed-borne and air-borne fungal spores."
            }
        ],
        "organic_remedies": [
            "Foliar spray with Trichoderma harzianum (45g / 15L tank).",
            "Apply well-rotted Farmyard Manure (FYM) and Potassium to correct nutrient-deficient soils."
        ],
        "chemical_remedies": [
            "Spray Mancozeb 75% WP @ 35-40 g per 15L backpack tank.",
            "Spray Propiconazole 25% EC @ 15 ml per 15L tank at panicle initiation."
        ],
        "preventive_practices": [
            "Brown spot is an indicator of poor soil nutrition; apply balanced NPK + Zinc.",
            "Treat seed with Carbendazim 50% WP @ 2g per kg seed."
        ],
        "tanki_quick_dose": "Tilt 15ml OR Mancozeb 40g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "25°C - 30°C",
            "humidity_threshold": "> 80%",
            "leaf_wetness_hours": "Intermittent rain showers followed by dry spells"
        }
    },
    "Rice___healthy": {
        "crop": "Rice",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Vigorous, dark green upright tillers with clean leaf blades free of lesions or streaks.",
        "symptoms_hi": "स्वस्थ, हरी-भरी पत्तियां बिना किसी धब्बे या फंगस के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive maintenance)",
                "dose_per_tank_15l": "30-35 ml per 15L tank",
                "dose_per_acre": "400-500 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Continue balanced organic nutrition (Vermicompost, Jeevamrut)."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Maintain 2-3 cm water level; monitor for stem borer and plant hoppers."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Wheat
    "Wheat___Yellow_Rust": {
        "crop": "Wheat",
        "disease": "Yellow Rust (Stripe Rust)",
        "pathogen": "Puccinia striiformis f. sp. tritici - Fungus",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Yellowish-orange powdery pustules arranged in parallel linear stripes along leaf veins.",
        "symptoms_hi": "पत्तियों की नसों के समानांतर पीली पाउडर जैसी धारियां (पीला रतुआ)।",
        "cibrc_chemical": [
            {
                "name": "Propiconazole 25% EC (Tilt / Bumper)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                "phi_days": 21,
                "application_notes": "MANDATORY immediate spray upon spotting first stripe. Repeat after 15 days if yellow dust spreads."
            },
            {
                "name": "Tebuconazole 25.9% EC (Folicur)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹75 - ₹95 per tank (₹500/acre)",
                "phi_days": 21,
                "application_notes": "High efficacy eradication of yellow rust spores."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma viride 1% WP",
                "dose_per_tank_15l": "50 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹30 - ₹40 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Bio-fungicide preventive for early season rust suppression."
            }
        ],
        "organic_remedies": [
            "Foliar spray with Trichoderma viride at early tillering stage.",
            "Spray sour buttermilk (chaas) @ 500ml per 15L tank for mild fungal inhibition."
        ],
        "chemical_remedies": [
            "Immediately spray Propiconazole 25% EC @ 15 ml per 15L tank (200 ml/acre).",
            "Spray Tebuconazole 25.9% EC @ 15 ml per 15L tank."
        ],
        "preventive_practices": [
            "Sow rust-resistant varieties approved for your zone (e.g. HD 3086, DBW 187, DBW 222).",
            "Monitor North-Western Plain Zone fields actively during January-February cool spells."
        ],
        "tanki_quick_dose": "Tilt (Propiconazole) 15ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "10°C - 20°C",
            "humidity_threshold": "> 85%",
            "leaf_wetness_hours": "Cool humid nights with morning fog and dew"
        }
    },
    "Wheat___Brown_Rust": {
        "crop": "Wheat",
        "disease": "Brown Rust (Leaf Rust)",
        "pathogen": "Puccinia triticina - Fungus",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Round to oval brown/cinnamon-orange powdery pustules randomly scattered on leaf blades.",
        "symptoms_hi": "गेहूँ की पत्तियों पर बिखरे हुए गोल भूरे-नारंगी पाउडर वाले धब्बे (भूरा रतुआ)।",
        "cibrc_chemical": [
            {
                "name": "Propiconazole 25% EC (Tilt)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                "phi_days": 21,
                "application_notes": "Curative and protective systemic triazole spray."
            },
            {
                "name": "Mancozeb 75% WP (Indofil M-45)",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500-600 g in 200L water",
                "est_cost_inr": "₹40 - ₹60 per tank (₹300/acre)",
                "phi_days": 15,
                "application_notes": "Protective contact fungicide to halt spore expansion."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma harzianum 1% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Apply bio-agent at flag leaf emergence."
            }
        ],
        "organic_remedies": ["Spray Trichoderma harzianum at 45g/15L tank; ensure balanced potash fertilizer."],
        "chemical_remedies": [
            "Spray Propiconazole 25% EC @ 15 ml per 15L tank.",
            "Spray Mancozeb 75% WP @ 35 g per 15L tank."
        ],
        "preventive_practices": ["Plant resistant varieties; avoid delayed late sowing."],
        "tanki_quick_dose": "Tilt 15ml OR Mancozeb 40g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "20°C - 25°C",
            "humidity_threshold": "> 75%",
            "leaf_wetness_hours": "Warm sunny days with humid evenings in February-March"
        }
    },
    "Wheat___Powdery_Mildew": {
        "crop": "Wheat",
        "disease": "Powdery Mildew",
        "pathogen": "Blumeria graminis f. sp. tritici - Fungus",
        "severity": "Medium",
        "severity_gauge": "yellow",
        "symptoms": "White to grayish-white powdery cottony patches appearing on upper surface of leaves.",
        "symptoms_hi": "गेहूँ की पत्तियों की ऊपरी सतह पर सफेद चूर्ण जैसे धब्बे (चूर्णिल आसिता)।",
        "cibrc_chemical": [
            {
                "name": "Wettable Sulphur 80% WDG (Sulfex)",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                "phi_days": 7,
                "application_notes": "Excellent control of surface powdery mildew mycelium."
            },
            {
                "name": "Hexaconazole 5% EC (Contaf)",
                "dose_per_tank_15l": "15-20 ml per 15L tank",
                "dose_per_acre": "250 ml in 200L water",
                "est_cost_inr": "₹50 - ₹70 per tank (₹350/acre)",
                "phi_days": 15,
                "application_notes": "Systemic triazole with quick knock-down action."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Potassium Bicarbonate / Baking Soda formulation",
                "dose_per_tank_15l": "40 g per 15L tank + 10 ml vegetable oil",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹20 - ₹35 per tank (₹150/acre)",
                "phi_days": 0,
                "application_notes": "Alkaline solution disrupts fungal cell membranes."
            }
        ],
        "organic_remedies": ["Spray Baking Soda + vegetable oil emulsifier; prune overly dense canopy."],
        "chemical_remedies": [
            "Spray Wettable Sulphur 80% @ 35-40 g per 15L tank.",
            "Spray Hexaconazole 5% EC @ 15-20 ml per 15L tank."
        ],
        "preventive_practices": ["Avoid over-dense seeding; allow sunlight penetration."],
        "tanki_quick_dose": "Sulfex 40g OR Contaf 15ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "15°C - 22°C",
            "humidity_threshold": "> 70%",
            "leaf_wetness_hours": "Dry sunny days with cool humid nights"
        }
    },
    "Wheat___healthy": {
        "crop": "Wheat",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Clean green leaves with erect stature and no rust pustules or powdery patches.",
        "symptoms_hi": "स्वस्थ हरी पत्तियां, बिना किसी रतुआ या सफेद धब्बे के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "30-35 ml per 15L tank",
                "dose_per_acre": "400-500 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Maintain optimal irrigation at crown root initiation (CRI) and flowering."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Monitor weekly for any rust pustules during cool foggy days."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Cotton
    "Cotton___Bacterial_Blight": {
        "crop": "Cotton",
        "disease": "Bacterial Blight (Angular Leaf Spot / Blackarm)",
        "pathogen": "Xanthomonas citri pv. malvacearum - Bacteria",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Angular, water-soaked lesions bounded by leaf veinlets turning dark reddish-brown to black.",
        "symptoms_hi": "कपास की पत्तियों पर नसों के बीच कोणीय काले-भूरे धब्बे (कोणीय पत्ती धब्बा)।",
        "cibrc_chemical": [
            {
                "name": "Copper Oxychloride 50% WP (Blitox) + Streptocycline",
                "dose_per_tank_15l": "35 g Blitox + 2 g Streptocycline per 15L tank",
                "dose_per_acre": "500 g + 25 g in 200L water",
                "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                "phi_days": 14,
                "application_notes": "Synergistic bactericide spray covering both upper and lower leaf surface."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Pseudomonas fluorescens 1.5% WP",
                "dose_per_tank_15l": "50 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Apply biocontrol agent before monsoon showers."
            }
        ],
        "organic_remedies": ["Spray Pseudomonas fluorescens; collect and burn fallen infected leaves and stems."],
        "chemical_remedies": ["Spray Copper Oxychloride 50% WP @ 35g + Streptocycline @ 2g per 15L tank."],
        "preventive_practices": ["Acid-delint seed before sowing; use resistant Bt hybrids."],
        "tanki_quick_dose": "Blitox 35g + Streptocycline 2g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "28°C - 34°C",
            "humidity_threshold": "> 85%",
            "leaf_wetness_hours": "Intermittent monsoon showers with heavy wind splashing"
        }
    },
    "Cotton___Leaf_Curl_Virus": {
        "crop": "Cotton",
        "disease": "Cotton Leaf Curl Virus (CLCuV)",
        "pathogen": "Cotton Leaf Curl Begomovirus (Transmitted by Whitefly Bemisia tabaci)",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Upward or downward curling of leaves, vein thickening, and leaf enations (cup-shaped outgrowths) on underside.",
        "symptoms_hi": "पत्तियों का ऊपर या नीचे की ओर मुड़ना, नसों का मोटा होना और नीचे प्याले जैसी संरचना (मरोड़िया)।",
        "cibrc_chemical": [
            {
                "name": "Diafenthiuron 50% WP (Pegasus)",
                "dose_per_tank_15l": "18-20 g per 15L tank",
                "dose_per_acre": "250 g in 200L water",
                "est_cost_inr": "₹70 - ₹95 per tank (₹480/acre)",
                "phi_days": 21,
                "application_notes": "Knockdown of whitefly vector colonies feeding on leaf underside."
            },
            {
                "name": "Afidopyropen 50 g/L DC (Sefina)",
                "dose_per_tank_15l": "30 ml per 15L tank",
                "dose_per_acre": "400 ml in 200L water",
                "est_cost_inr": "₹90 - ₹120 per tank (₹750/acre)",
                "phi_days": 15,
                "application_notes": "Immediate paralysis of whitefly feeding mechanisms."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Azadirachtin)",
                "dose_per_tank_15l": "45-50 ml per 15L tank",
                "dose_per_acre": "600 ml in 200L water",
                "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                "phi_days": 0,
                "application_notes": "Repels whiteflies and disrupts egg-laying cycles."
            },
            {
                "name": "Install Yellow Sticky Traps",
                "dose_per_tank_15l": "10-12 traps per acre",
                "dose_per_acre": "10-12 traps per acre",
                "est_cost_inr": "₹150 per acre total",
                "phi_days": 0,
                "application_notes": "Physical monitoring and mass trapping of adult whiteflies."
            }
        ],
        "organic_remedies": [
            "Install 10-12 yellow sticky traps per acre at canopy height.",
            "Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil 10,000 PPM.",
            "Uproot and bury severely stunted viral plants immediately to halt field spread."
        ],
        "chemical_remedies": [
            "Spray Diafenthiuron 50% WP @ 18-20 g per 15L tank.",
            "Spray Sefina (Afidopyropen) @ 30 ml per 15L tank for heavy whitefly infestations."
        ],
        "preventive_practices": [
            "Sow CLCuD-tolerant hybrids; eradicate weed hosts like Abutilon indicum from field margins."
        ],
        "tanki_quick_dose": "Pegasus 18g OR Neem Oil 50ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "30°C - 38°C",
            "humidity_threshold": "60% - 75%",
            "leaf_wetness_hours": "Dry hot spells promoting rapid whitefly multiplication"
        }
    },
    "Cotton___Bollworm_Damage": {
        "crop": "Cotton",
        "disease": "Bollworm & Foliar Caterpillars Damage",
        "pathogen": "Helicoverpa armigera / Spodoptera litura (Insect Pests)",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Irregular chewed holes on leaves, flared bracts ('square drop'), and bore holes plugged with caterpillar excreta.",
        "symptoms_hi": "पत्तियों में बड़े कटे-फटे छेद और गूलर/फूलों में छेद (इल्ली / सुंडी का प्रकोप)।",
        "cibrc_chemical": [
            {
                "name": "Chlorantraniliprole 18.5% SC (Coragen)",
                "dose_per_tank_15l": "6 ml per 15L tank",
                "dose_per_acre": "60 ml in 200L water",
                "est_cost_inr": "₹80 - ₹110 per tank (₹600/acre)",
                "phi_days": 21,
                "application_notes": "Long-lasting ingestion and contact control against all larval instars."
            },
            {
                "name": "Emamectin Benzoate 5% SG (Proclaim)",
                "dose_per_tank_15l": "8-10 g per 15L tank",
                "dose_per_acre": "100 g in 200L water",
                "est_cost_inr": "₹60 - ₹85 per tank (₹450/acre)",
                "phi_days": 14,
                "application_notes": "Stomach action paralyzing caterpillar feeding within 2 hours."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Bacillus thuringiensis kurstaki (Bt) 5% WP",
                "dose_per_tank_15l": "30-35 g per 15L tank",
                "dose_per_acre": "400 g in 200L water",
                "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                "phi_days": 0,
                "application_notes": "Spray late evening when young larvae feed actively."
            },
            {
                "name": "Pheromone Traps for Helicoverpa / Spodoptera",
                "dose_per_tank_15l": "5 traps per acre",
                "dose_per_acre": "5 traps per acre",
                "est_cost_inr": "₹120 per acre",
                "phi_days": 0,
                "application_notes": "Monitor moth catches to time spray applications."
            }
        ],
        "organic_remedies": [
            "Install 5 pheromone traps per acre for pest monitoring.",
            "Spray Bacillus thuringiensis (Bt formulation) @ 30g/15L tank.",
            "Release Trichogramma egg parasitoids @ 60,000/acre at flower bud stage."
        ],
        "chemical_remedies": [
            "Spray Coragen (Chlorantraniliprole 18.5% SC) @ 6 ml per 15L tank.",
            "Spray Emamectin Benzoate 5% SG @ 8-10 g per 15L tank."
        ],
        "preventive_practices": ["Avoid excess nitrogen; plant marigold or castor as trap crops on borders."],
        "tanki_quick_dose": "Coragen 6ml OR Proclaim 10g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "26°C - 35°C",
            "humidity_threshold": "> 65%",
            "leaf_wetness_hours": "Cloudy post-monsoon weather accelerating moth oviposition"
        }
    },
    "Cotton___healthy": {
        "crop": "Cotton",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Broad green leaves without angular water spots, curling, or chewed holes.",
        "symptoms_hi": "स्वस्थ और चौड़ी हरी पत्तियां, बिना किसी मरोड़िया या कीड़े के छेद के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "35 ml per 15L tank",
                "dose_per_acre": "450 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Apply foliar spray of 19:19:19 or Jeevamrut to support vegetative flush."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Check undersides of leaves twice weekly for early whitefly or aphid signs."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Sugarcane
    "Sugarcane___Red_Rot": {
        "crop": "Sugarcane",
        "disease": "Red Rot",
        "pathogen": "Colletotrichum falcatum - Fungus",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Third or fourth leaf from top yellows and withers; split midrib shows blood-red discoloration with white transverse bands and alcoholic odor.",
        "symptoms_hi": "गन्ने की बीच की नस में लाल रंग के धब्बे और तना चीरने पर सफेद पट्टियों के साथ लाल सड़ांध (लाल सड़न)।",
        "cibrc_chemical": [
            {
                "name": "Carbendazim 50% WP (Bavistin)",
                "dose_per_tank_15l": "30 g per 15L tank (sett treatment / soil drench)",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹45 - ₹65 per tank (₹350/acre)",
                "phi_days": 30,
                "application_notes": "Soak planting setts for 15 minutes before planting to eliminate seed-borne inoculum."
            },
            {
                "name": "Thiophanate Methyl 70% WP (Roko)",
                "dose_per_tank_15l": "25 g per 15L tank",
                "dose_per_acre": "400 g in 200L water",
                "est_cost_inr": "₹60 - ₹80 per tank (₹450/acre)",
                "phi_days": 28,
                "application_notes": "Foliar and root zone drenching at early midrib infection."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma viride 1% WP",
                "dose_per_tank_15l": "60 g per 15L tank",
                "dose_per_acre": "2.5 kg mixed with 100 kg FYM per acre",
                "est_cost_inr": "₹30 - ₹45 per tank (₹250/acre)",
                "phi_days": 0,
                "application_notes": "Soil application during planting; aggressively colonizes root rhizosphere."
            }
        ],
        "organic_remedies": [
            "Treat seed setts with Trichoderma viride culture (10g/L water) for 30 minutes.",
            "Uproot entire affected stool along with roots and burn outside the field."
        ],
        "chemical_remedies": [
            "Sett dip in Carbendazim 50% WP @ 2g/L or Thiophanate Methyl @ 1.5g/L.",
            "Spray Thiophanate Methyl @ 25g per 15L tank on surrounding foliage."
        ],
        "preventive_practices": [
            "Never take ratoon crops from an infected sugarcane plot.",
            "Use certified red-rot resistant varieties (e.g. Co 0238 substitutes like Co 15023, Co 0118)."
        ],
        "tanki_quick_dose": "Bavistin 30g OR Roko 25g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "28°C - 32°C",
            "humidity_threshold": "> 90%",
            "leaf_wetness_hours": "Waterlogged fields following heavy monsoon rains"
        }
    },
    "Sugarcane___Rust": {
        "crop": "Sugarcane",
        "disease": "Sugarcane Rust",
        "pathogen": "Puccinia melanocephala - Fungus",
        "severity": "Medium",
        "severity_gauge": "yellow",
        "symptoms": "Small elongated yellowish spots turning reddish-brown to dark brown powdery pustules on both leaf surfaces.",
        "symptoms_hi": "गन्ने की पत्तियों पर छोटे पीले-भूरे रतुआ जैसे धब्बे।",
        "cibrc_chemical": [
            {
                "name": "Mancozeb 75% WP",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "600 g in 200L water",
                "est_cost_inr": "₹45 - ₹60 per tank (₹300/acre)",
                "phi_days": 15,
                "application_notes": "Foliar coverage at first symptom onset."
            },
            {
                "name": "Propiconazole 25% EC",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹65 - ₹85 per tank (₹450/acre)",
                "phi_days": 21,
                "application_notes": "Systemic eradication of rust pustules."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma viride 1% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Suppresses rust spore multiplication."
            }
        ],
        "organic_remedies": ["Spray Trichoderma viride; remove lower dried leaves to improve air circulation."],
        "chemical_remedies": [
            "Spray Mancozeb 75% WP @ 35g per 15L tank.",
            "Spray Propiconazole 25% EC @ 15 ml per 15L tank."
        ],
        "preventive_practices": ["Avoid over-dense row spacing; strip dry trash from cane stalks."],
        "tanki_quick_dose": "Mancozeb 40g OR Propiconazole 15ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "20°C - 26°C",
            "humidity_threshold": "> 80%",
            "leaf_wetness_hours": "High relative humidity with cool night breezes"
        }
    },
    "Sugarcane___healthy": {
        "crop": "Sugarcane",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Lush long green blades with strong white midribs and solid stout stalks.",
        "symptoms_hi": "स्वस्थ हरी पत्तियां, बिना किसी लाल धब्बे या रतुआ के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "35 ml per 15L tank",
                "dose_per_acre": "500 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Apply earthing up and trash mulching for soil moisture conservation."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Monitor cane tillers periodically for early shoot borer."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Mustard
    "Mustard___White_Rust": {
        "crop": "Mustard",
        "disease": "White Rust (Blister)",
        "pathogen": "Albugo candida - Oomycete / Fungus",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Prominent white or creamy-yellow raised blisters/pustules on underside of leaves; floral distortion ('staghead').",
        "symptoms_hi": "सरसों की पत्तियों की निचली सतह पर सफेद फफोले जैसे धब्बे और फूलों का मुड़ना (सफेद रतुआ)।",
        "cibrc_chemical": [
            {
                "name": "Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold)",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹75 - ₹95 per tank (₹550/acre)",
                "phi_days": 21,
                "application_notes": "Curative systemic oomycete inhibitor. Spray at first blister sight."
            },
            {
                "name": "Mancozeb 75% WP (Dithane M-45)",
                "dose_per_tank_15l": "35 g per 15L tank",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹40 - ₹55 per tank (₹300/acre)",
                "phi_days": 14,
                "application_notes": "Protective contact spray against secondary spread."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma viride 1% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Suppresses oomycete spore germination."
            }
        ],
        "organic_remedies": ["Spray Trichoderma viride; pick off and destroy deformed floral stagheads."],
        "chemical_remedies": [
            "Spray Ridomil Gold (Metalaxyl + Mancozeb) @ 35g per 15L tank.",
            "Spray Mancozeb 75% WP @ 35g per 15L tank."
        ],
        "preventive_practices": [
            "Complete sowing by October 15-25 to escape peak white rust incidence.",
            "Use certified varieties like Giriraj, RH-749, or NRCHB 101."
        ],
        "tanki_quick_dose": "Ridomil Gold 35g OR Mancozeb 35g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "12°C - 18°C",
            "humidity_threshold": "> 85%",
            "leaf_wetness_hours": "Cloudy, cool winter mornings with persistent fog in December-January"
        }
    },
    "Mustard___Alternaria_Blight": {
        "crop": "Mustard",
        "disease": "Alternaria Leaf Blight",
        "pathogen": "Alternaria brassicae / Alternaria brassicicola - Fungus",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Concentric target-like circular brown-black spots on leaves, stems, and seed pods (siliquae).",
        "symptoms_hi": "सरसों की पत्तियों और फलियों पर गोल काले-भूरे छल्लेदार धब्बे (अल्टरनेरिया झुलसा)।",
        "cibrc_chemical": [
            {
                "name": "Iprodione 50% WP (Rovral)",
                "dose_per_tank_15l": "30 g per 15L tank",
                "dose_per_acre": "400 g in 200L water",
                "est_cost_inr": "₹70 - ₹90 per tank (₹500/acre)",
                "phi_days": 15,
                "application_notes": "High efficacy against Alternaria leaf and pod spot."
            },
            {
                "name": "Mancozeb 75% WP",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500-600 g in 200L water",
                "est_cost_inr": "₹40 - ₹55 per tank (₹300/acre)",
                "phi_days": 14,
                "application_notes": "Spray at 45 and 60 days after sowing."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma harzianum 1% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Apply bio-fungicide preventively before pod formation."
            }
        ],
        "organic_remedies": ["Spray Trichoderma harzianum; avoid overhead sprinkler irrigation during peak flowering."],
        "chemical_remedies": [
            "Spray Iprodione 50% WP @ 30g per 15L tank.",
            "Spray Mancozeb 75% WP @ 35-40g per 15L tank."
        ],
        "preventive_practices": ["Seed treatment with Apron 35 SD or Thiram @ 3g/kg seed."],
        "tanki_quick_dose": "Mancozeb 40g OR Rovral 30g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "18°C - 24°C",
            "humidity_threshold": "> 80%",
            "leaf_wetness_hours": "Intermittent winter rains followed by bright sunshine"
        }
    },
    "Mustard___healthy": {
        "crop": "Mustard",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Bright green broad leaves without white blisters or brown concentric rings.",
        "symptoms_hi": "स्वस्थ हरी पत्तियां, बिना किसी सफेद छाले या काले धब्बे के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "35 ml per 15L tank",
                "dose_per_acre": "450 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Ensure balanced sulphur nutrition (Gypsum or Bentonite Sulphur)."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Monitor mustard aphid (mohola) colonies on tender shoots in January."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Chilli
    "Chilli___Leaf_Curl": {
        "crop": "Chilli",
        "disease": "Chilli Leaf Curl Virus (ChLCV / Murda Rog)",
        "pathogen": "Chilli Leaf Curl Begomovirus (Transmitted by Whitefly / Thrips / Mites)",
        "severity": "Critical",
        "severity_gauge": "red",
        "symptoms": "Severe puckering and upward/downward curling of leaves ('boat-shaped'), stunted bushy shoots, and flower drop.",
        "symptoms_hi": "पत्तियों का सिकुड़ना, नाव की तरह मुड़ना और पौधों का बौना होना (मरोड़िया या चुर्रा-मुर्रा रोग)।",
        "cibrc_chemical": [
            {
                "name": "Diafenthiuron 50% WP (Pegasus)",
                "dose_per_tank_15l": "18-20 g per 15L tank",
                "dose_per_acre": "250 g in 200L water",
                "est_cost_inr": "₹70 - ₹95 per tank (₹480/acre)",
                "phi_days": 15,
                "application_notes": "Effective against both thrips and whitefly vectors."
            },
            {
                "name": "Spinetoram 11.7% SC (Delegate)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "180 ml in 200L water",
                "est_cost_inr": "₹95 - ₹125 per tank (₹750/acre)",
                "phi_days": 7,
                "application_notes": "Top-tier control for thrips causing upward leaf curl."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Azadirachtin)",
                "dose_per_tank_15l": "45-50 ml per 15L tank",
                "dose_per_acre": "600 ml in 200L water",
                "est_cost_inr": "₹35 - ₹50 per tank (₹250/acre)",
                "phi_days": 0,
                "application_notes": "Spray weekly on underside of chilli canopy."
            },
            {
                "name": "Blue & Yellow Sticky Traps",
                "dose_per_tank_15l": "15 traps per acre (Blue for thrips, Yellow for whitefly)",
                "dose_per_acre": "15 traps per acre",
                "est_cost_inr": "₹180 per acre",
                "phi_days": 0,
                "application_notes": "Mass-trap flying vectors before virus transmission."
            }
        ],
        "organic_remedies": [
            "Install Blue and Yellow sticky traps (15/acre) at crop height.",
            "Spray Neem Oil 10,000 PPM @ 50ml/15L tank every 7 days.",
            "Spray fermented sour buttermilk (chaas) @ 500ml per 15L tank."
        ],
        "chemical_remedies": [
            "Spray Pegasus (Diafenthiuron 50% WP) @ 18-20 g per 15L tank.",
            "Spray Delegate (Spinetoram 11.7% SC) @ 15 ml per 15L tank for thrips."
        ],
        "preventive_practices": [
            "Plant 2-3 border rows of maize or jowar as a physical barrier against insect vectors."
        ],
        "tanki_quick_dose": "Pegasus 18g OR Delegate 15ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "28°C - 36°C",
            "humidity_threshold": "40% - 65%",
            "leaf_wetness_hours": "Dry warm conditions accelerating thrips and mite reproduction"
        }
    },
    "Chilli___Anthracnose_Dieback": {
        "crop": "Chilli",
        "disease": "Anthracnose & Fruit Rot (Dieback)",
        "pathogen": "Colletotrichum capsici - Fungus",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Circular sunken spots on ripe fruits with black concentric acervuli rings; tips of branches wither from top down (dieback).",
        "symptoms_hi": "शाखाओं का ऊपर से नीचे की ओर सूखना और फलों पर काले धंसे हुए गोल धब्बे (डाइबैक / फल सड़न)।",
        "cibrc_chemical": [
            {
                "name": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹85 - ₹110 per tank (₹650/acre)",
                "phi_days": 7,
                "application_notes": "Superior systemic eradication of fruit rot and twig dieback."
            },
            {
                "name": "Copper Oxychloride 50% WP",
                "dose_per_tank_15l": "35 g per 15L tank",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹45 - ₹60 per tank (₹300/acre)",
                "phi_days": 10,
                "application_notes": "Protective copper barrier on fruits and foliage."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma viride 1% WP",
                "dose_per_tank_15l": "50 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Bio-protective spray at flowering and fruit set."
            }
        ],
        "organic_remedies": ["Spray Trichoderma viride; clip off and burn dried twigs (dieback shoots)."],
        "chemical_remedies": [
            "Spray Amistar Top (Azoxystrobin + Difenoconazole) @ 15 ml per 15L tank.",
            "Spray Copper Oxychloride 50% WP @ 35 g per 15L tank."
        ],
        "preventive_practices": ["Treat seeds with Thiram @ 3g/kg; avoid overhead irrigation during fruiting."],
        "tanki_quick_dose": "Amistar Top 15ml OR Blitox 35g per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "26°C - 32°C",
            "humidity_threshold": "> 80%",
            "leaf_wetness_hours": "Heavy monsoon rains followed by warm sunny afternoons"
        }
    },
    "Chilli___healthy": {
        "crop": "Chilli",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Dark glossy green flat leaves with healthy flowers and firm fruit set.",
        "symptoms_hi": "चमकदार स्वस्थ हरी पत्तियां, बिना किसी मरोड़िया या फल सड़न के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "35 ml per 15L tank",
                "dose_per_acre": "450 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Foliar spray with Seaweed extract or Jeevamrut every 15 days."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Maintain clean weeding around chilli ridges."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    },

    # Onion
    "Onion___Purple_Blotch": {
        "crop": "Onion",
        "disease": "Purple Blotch",
        "pathogen": "Alternaria porri - Fungus",
        "severity": "High",
        "severity_gauge": "red",
        "symptoms": "Small sunken water-soaked spots with distinct purple center and yellow halo expanding down the onion leaves.",
        "symptoms_hi": "प्याज़ की पत्तियों पर बीच में बैंगनी और किनारे पीले रंग के अंडाकार धब्बे (बैंगनी धब्बा रोग)।",
        "cibrc_chemical": [
            {
                "name": "Difenoconazole 25% EC (Score)",
                "dose_per_tank_15l": "15 ml per 15L tank",
                "dose_per_acre": "200 ml in 200L water",
                "est_cost_inr": "₹75 - ₹95 per tank (₹500/acre)",
                "phi_days": 14,
                "application_notes": "MANDATORY: Add a non-ionic sticker/spreader (Sandovit / Apsa-80 @ 10ml/tank) due to waxy onion leaves."
            },
            {
                "name": "Mancozeb 75% WP",
                "dose_per_tank_15l": "35-40 g per 15L tank",
                "dose_per_acre": "500-600 g in 200L water",
                "est_cost_inr": "₹40 - ₹55 per tank (₹300/acre)",
                "phi_days": 15,
                "application_notes": "Protective contact spray across foliar canopy."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Trichoderma harzianum 1% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Bio-fungicide preventive for leaf blight protection."
            }
        ],
        "organic_remedies": [
            "Foliar spray with Trichoderma harzianum at 45g/15L tank.",
            "Always mix with soap/detergent (sticker) so spray clings to waxy onion foliage."
        ],
        "chemical_remedies": [
            "Spray Score (Difenoconazole 25% EC) @ 15 ml per 15L tank + 10ml sticker.",
            "Spray Mancozeb 75% WP @ 35-40 g per 15L tank + sticker."
        ],
        "preventive_practices": [
            "Maintain raised bed drainage to avoid standing water around onion bulbs."
        ],
        "tanki_quick_dose": "Score 15ml + Sticker 10ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "25°C - 30°C",
            "humidity_threshold": "> 85%",
            "leaf_wetness_hours": "Warm humid weather with dew and morning fog"
        }
    },
    "Onion___Stemphylium_Blight": {
        "crop": "Onion",
        "disease": "Stemphylium Leaf Blight",
        "pathogen": "Stemphylium vesicarium - Fungus",
        "severity": "Medium",
        "severity_gauge": "yellow",
        "symptoms": "Small light yellow to pale brown spots that coalesce into extended dark brown foliar blight from leaf tips.",
        "symptoms_hi": "पत्तियों की नोक से शुरू होकर नीचे की ओर बढ़ता हुआ पीला-भूरा झुलसा रोग।",
        "cibrc_chemical": [
            {
                "name": "Carbendazim 12% + Mancozeb 63% WP (Saaf)",
                "dose_per_tank_15l": "30-35 g per 15L tank",
                "dose_per_acre": "500 g in 200L water",
                "est_cost_inr": "₹45 - ₹65 per tank (₹350/acre)",
                "phi_days": 15,
                "application_notes": "Apply with sticking agent (10ml sticker/tank) for maximum retention."
            }
        ],
        "cibrc_organic": [
            {
                "name": "Pseudomonas fluorescens 1.5% WP",
                "dose_per_tank_15l": "45 g per 15L tank",
                "dose_per_acre": "1.0 kg in 200L water",
                "est_cost_inr": "₹25 - ₹40 per tank (₹180/acre)",
                "phi_days": 0,
                "application_notes": "Foliar bio-agent spray."
            }
        ],
        "organic_remedies": ["Spray Pseudomonas fluorescens with organic wetting agent."],
        "chemical_remedies": ["Spray Saaf (Carbendazim + Mancozeb) @ 30-35g per 15L tank + sticker."],
        "preventive_practices": ["Avoid excessive sprinkler irrigation late in the evening."],
        "tanki_quick_dose": "Saaf 30g + Sticker 10ml per 15L Tank (ढोलकी)",
        "weather_triggers": {
            "ideal_temp_range": "20°C - 28°C",
            "humidity_threshold": "> 80%",
            "leaf_wetness_hours": "Prolonged leaf wetness with cloudy periods"
        }
    },
    "Onion___healthy": {
        "crop": "Onion",
        "disease": "Healthy Crop",
        "pathogen": "None (Healthy)",
        "severity": "Low",
        "severity_gauge": "green",
        "symptoms": "Upright, tubular waxy bluish-green leaves with healthy growing tips.",
        "symptoms_hi": "स्वस्थ और खड़ी पत्तियां बिना किसी बैंगनी या पीले धब्बे के।",
        "cibrc_chemical": [],
        "cibrc_organic": [
            {
                "name": "Neem Oil 10,000 PPM (Preventive)",
                "dose_per_tank_15l": "35 ml per 15L tank",
                "dose_per_acre": "450 ml in 200L water",
                "est_cost_inr": "₹30 - ₹45 per tank (₹200/acre)",
                "phi_days": 0,
                "application_notes": "Routine bio-spray to keep foliage pest-free."
            }
        ],
        "organic_remedies": ["Apply balanced potash and sulphur to support bulb swelling."],
        "chemical_remedies": ["No chemical treatment required."],
        "preventive_practices": ["Monitor for onion thrips (piliya) in leaf axils."],
        "tanki_quick_dose": "No chemical needed. Crop leaf is healthy!",
        "weather_triggers": {}
    }
}

# Merge Indian crops data into existing remedies
for k, v in indian_crops_data.items():
    existing_data[k] = v

with open(REMEDIES_FILE, "w", encoding="utf-8") as f:
    json.dump(existing_data, f, indent=2, ensure_ascii=False)

print(f"Successfully updated {REMEDIES_FILE}. Total classes now: {len(existing_data)}")

# Odisha MargDarshak
### AI-Powered Smart Logistics & Accessibility Intelligence Platform for the State of Odisha

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-30%20Odisha%20Districts-blue.svg)]()
[![Frontend](https://img.shields.io/badge/Next.js-16.3.3%20(Turbopack)-black.svg)]()
[![Backend](https://img.shields.io/badge/FastAPI-0.115-009688.svg)]()
[![Database](https://img.shields.io/badge/PostgreSQL%2016-PostGIS%203.4-336791.svg)]()
[![Cache](https://img.shields.io/badge/Redis-7.0%20Alpine-DC382D.svg)]()
[![Govt Partner](https://img.shields.io/badge/OSDMA%20%7C%20ODRAF%20%7C%20Works%20Dept-Verified-emerald.svg)]()

---

## 1. Strategic Overview & Regional Context

**Odisha MargDarshak** is a mission-critical, enterprise-grade GIS and AI decision-support platform engineered specifically for the state of **Odisha, India**. Odisha faces severe compound geographical risks:

1. **River Basin Floods**: Mahanadi, Brahmani, Baitarani, and Subarnarekha river basins with severe annual monsoon overtopping.
2. **Coastal Cyclones & Storm Surges**: High-vulnerability coastal districts including Balasore, Bhadrak, Kendrapara, Jagatsinghpur, Puri, and Ganjam facing Bay of Bengal depressions.
3. **Eastern Ghats Landslides & Rockfalls**: Mountainous passes and ghat sections across Koraput, Rayagada, Kandhamal (Kalinga Ghat), Gajapati, and Kendujhar (Kanjipani Ghat).
4. **Heavy Industrial & Port Freight Corridors**: Heavy multi-axle freight movement connecting mineral belts (Joda, Barbil, Angul, Jharsuguda) to Paradip Deepwater Port, Dhamra Port, and Gopalpur Port via NH-16, NH-55, NH-53, NH-20, and the Biju Expressway.

Odisha MargDarshak unifies real-time hydrological telemetry, IMD Doppler weather feeds, synthetic aperture radar (SAR) satellite imagery, crowd-sourced ground intelligence, and machine learning models to deliver **predictive hazard mapping, disruption classification, automated green corridor routing, and cascading infrastructure impact analysis**.

---

## 2. All 30 Districts of Odisha Integrated

Odisha MargDarshak provides comprehensive coverage, GIS boundary polygons, centroids, facility mapping, and localized risk scoring for all **30 administrative districts**:

| Region | Districts Covered |
| :--- | :--- |
| **Coastal Odisha** | Balasore, Bhadrak, Kendrapara, Jagatsinghpur, Puri, Ganjam |
| **Central / Mahanadi Basin** | Cuttack, Khordha (Bhubaneswar), Nayagarh, Jajpur, Dhenkanal, Angul |
| **Northern / Mining Belt** | Kendujhar (Keonjhar), Mayurbhanj, Sundargarh (Rourkela), Deogarh |
| **Western / Agricultural Belt** | Sambalpur, Bargarh, Jharsuguda, Balangir, Subarnapur (Sonepur), Nuapada, Boudh |
| **Southern / Eastern Ghats** | Koraput, Rayagada, Gajapati, Kandhamal, Kalahandi, Malkangiri, Nabarangpur |

---

## 3. Platform Capabilities & Architecture

1. **Role-Based Login & Access Control (RBAC)**: Dedicated tailored portals for Citizens, Commercial Drivers, Field Engineers (Works Dept / ODRAF), District Administrators (Collectors / DDMAs), and Central State Leadership (OSDMA / Chief Minister's Dashboard).
2. **Live GIS & Connectivity Intelligence**: High-performance interactive 2D and 3D maps displaying real-time road conditions, bridge statuses, live fleet tracking, and multi-hazard overlays.
3. **Multi-Hazard AI Prediction**: Machine learning algorithms predicting flood inundation, coastal surge, and ghat landslide probabilities with 0-100 explainable risk scores.
4. **Road Damage & Traffic Assessment**: Real-time damage classification, pothole detection, road blockage identification, and GPS speed anomaly traffic congestion detection.
5. **Color-Coded Road Conditions**:
   - 🟢 **Green**: Safe / Normal Flow
   - 🟡 **Yellow**: Moderate Risk / Caution Required
   - 🟠 **Orange**: High Risk / Single-lane Traffic / Speed Restricted
   - 🔴 **Red**: Critical / Inundated / Blocked / Diverted
6. **Early Warning & Field Intelligence**: Village and ward-level alert dissemination, geo-tagged image uploads, voice reports with Odia (ଓଡ଼ିଆ) NLP speech recognition, and offline synchronization.
7. **Smart Routing & Bypass Intelligence**: Dijkstra and A* multi-factor safety-first routing algorithms avoiding hazard hotspots with turn-by-turn guidance and dynamic ETAs.
8. **Supply Chain & Essential Goods Tracking**: End-to-end monitoring of life-saving medical supplies, food grain convoys (FCI), oxygen tankers, and emergency relief supplies with priority green corridor flags.
9. **Government Command Center & AI Copilot**: Unified multi-source fusion dashboard for disaster management authorities with human-in-the-loop approvals and automated situation bulletins.
10. **Digital Twin & Resilience Simulation**: Dynamic stress-testing of Odisha's transportation network simulating Hirakud dam discharges, super cyclones, or ghat collapses with cascading failure trees.
11. **Real-Time Data Integration**: Direct ingestion pipelines for IMD Bhubaneswar, Central Water Commission (CWC) Mahanadi basin gauges, and Sentinel satellite passes.
12. **Offline-First PWA Architecture**: Offline incident caching, IndexedDB persistence, and seamless automatic synchronization upon reconnection.

---

## 4. Stakeholder Demonstration Personas

Pre-configured role credentials for instant evaluation and demonstration:

| Role | Username / Identifier | State / District Focus | Demo Password |
| :--- | :--- | :--- | :--- |
| **Central Admin (OSDMA SEOC)** | `asit.tripathy@odisha.gov.in` | Statewide / Odisha | `Admin@Odisha2026` |
| **District Admin (Khordha)** | `collector.khordha@odisha.gov.in` | Khordha (Bhubaneswar) | `Collector@KHO26` |
| **District Admin (Bhadrak)** | `collector.bhadrak@odisha.gov.in` | Bhadrak (Baitarani Basin) | `Collector@BHD26` |
| **Field Officer (ODRAF / PWD)** | `officer.biren@odisha.gov.in` | Coastal / Flood Zone | `Officer@ODRAF26` |
| **Commercial Driver** | `driver.soumya@odisha-freight.in` | Highway Spine (OD-05-GC-9104) | `Driver@OD2026` |
| **Citizen / Commuter** | `citizen.rashmita@gmail.com` | Cuttack / Commuter | `Citizen@OD2026` |

---

## 5. Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet / MapLibre GL, Three.js (3D Highway Scenes), Canvas Confetti.
- **Backend**: Python 3.12+ / FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), GeoAlchemy2, NetworkX, Scikit-Learn.
- **GIS & Database**: PostgreSQL 16 + PostGIS 3.4 / SQLite + SpatiaLite for local evaluation, Redis 7.0 for pub/sub telemetry caching.
- **Machine Learning**: Gradient Boosting Classifiers, Random Forests, Terrain Slope Analysis, Hydrological Runoff Models.

---

## 6. Local Quickstart

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Git

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Access UI at http://localhost:3000
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.db.init_db
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Access Swagger UI at http://localhost:8000/docs
```

---

## 7. Compliance & Data Governance Disclaimers

1. **Government Open Data**: Hydrological, meteorological, and road network datasets are aligned with standards from OSDMA, IMD, CWC, and OpenStreetMap under Open Data Commons.
2. **AI Advisory Standard**: All AI hazard predictions, disruption scores, and alternate routing recommendations serve as decision-support advisories and do not replace statutory administrative directives issued by District Collectors or Police Authorities.
3. **No Fake Roads or Hallucinated Data**: All route calculations utilize genuine verified road network topologies across National Highways, State Highways, and major district roads in Odisha.

---
Developed for the State of Odisha — **Odisha MargDarshak: Navigating Safety, Ensuring Resilience.**

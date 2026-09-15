# NER–MargDarshak
### AI-Powered Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region of India

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/pytest-102%20passed%20(100%25)-success.svg)]()
[![Frontend](https://img.shields.io/badge/Next.js-16.3.3%20(Turbopack)-black.svg)]()
[![Backend](https://img.shields.io/badge/FastAPI-0.115-009688.svg)]()
[![Database](https://img.shields.io/badge/PostgreSQL%2016-PostGIS%203.4-336791.svg)]()
[![Cache](https://img.shields.io/badge/Redis-7.0%20Alpine-DC382D.svg)]()
[![Region](https://img.shields.io/badge/Coverage-8%20NER%20States-orange.svg)]()

---

## 1. Strategic Overview & Regional Context

The North Eastern Region (NER) of India—spanning **Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Sikkim, and Tripura**—faces severe topographical and meteorological logistical challenges. Extreme monsoons, landslides, flash floods, seismic vulnerability, and critical bottleneck corridors (such as NH-6 through the Sonapur Tunnel and NH-27 across the Brahmaputra Basin) frequently isolate entire districts, paralyzing civilian movement and supply chains for essential commodities and medicine.

**NER–MargDarshak** is a unified, production-ready, web-based government decision-support and smart logistics platform. It provides continuous real-time accessibility intelligence, multi-modal risk prediction, dynamic route planning, digital twin simulation, cascading disruption analysis, and resilient infrastructure planning for government administrators, disaster management authorities (NDMA/SDRF), transport operators, and citizens.

---

## 2. System Architecture & Tech Stack

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │             NER–MargDarshak Web Platform                    │
                               │        Next.js 16 + TypeScript + MapLibre GL JS             │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │ REST / JWT / WebSocket
                               ┌──────────────────────────────▼──────────────────────────────┐
                               │           FastAPI High-Performance Async Backend            │
                               └──────┬───────────────────────┬───────────────────────┬──────┘
                                      │                       │                       │
           ┌──────────────────────────▼──────────┐ ┌──────────▼──────────┐ ┌──────────▼──────────┐
           │   PostgreSQL 16 + PostGIS Spatial   │ │ Redis 7 Message Bus │ │ AI & Spatial Models │
           │  Roads, Bridges, GPS, Incidents,    │ │ Sessions, WS Cache, │ │ GradientBoostingRisk│
           │  Routes, Shipments, Simulations     │ │ Realtime Pings      │ │ Cascading Impact    │
           └─────────────────────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

- **Frontend Application**: Next.js 16 (App Router), TypeScript, MapLibre GL JS (GIS WebGL rendering), TailwindCSS & Glassmorphism Design System, Lucide Icons.
- **Backend API Server**: FastAPI (Python 3.11/3.14), AsyncPG, SQLAlchemy 2.0 (Async ORM), Pydantic v2.
- **Spatial & Structured Database**: PostgreSQL 16 with **PostGIS 3.4** extension for native spatial math (ST_DWithin, ST_Distance, Bounding Boxes, Point-in-Polygon).
- **Message Bus & Real-Time Cache**: Redis 7 for distributed session management, driver GPS telemetry caching, and WebSocket event broadcasting.
- **AI & Explainability Suite**: Gradient Boosting Risk Model with SHAP-interpretable factor breakdown, Graph Traversal Disruption Engine, and Tool-Calling NLP Copilot.

---

## 3. The 22 Integrated Platform Modules

1. **Authentication & RBAC**: Strict 5-role hierarchy (`CITIZEN`, `DRIVER`, `FIELD_OFFICER`, `DISTRICT_ADMIN`, `CENTRAL_ADMIN`) with JWT security and route guards.
2. **Admin & User Management**: Role approvals, account suspension/reactivation, and driver vehicle assignments.
3. **Master Data Management (MDM)**: Foundational registry for hospitals, relief centers, warehouses, fuel stations, and emergency helipads with versioning and soft-archiving.
4. **Data Ingestion & External Integration Hub**: Configurable adapters for IMD radar telemetry, ISRO Bhuvan/Sentinel catalogs, MoRTH GIS layers, NDMA disaster alerts, and State Police advisories.
5. **GIS Map & Spatial Layers**: PostGIS-backed interactive maps with live driver markers, bridge load limits, road status colors, and terrain views.
6. **Live GPS Tracking & Telemetry Sync**: Real-time ping ingestion, speed anomaly detection, dilution of precision filtering, and offline batch synchronization.
7. **Smart Routing & Deviation Engine**: Multi-candidate routing with weather/incident avoidance, corridor segment weighting, and deviation alerts.
8. **Driver Trips & Dispatch Lifecycle**: Active trip monitoring, start/pause/complete transitions, and driver availability management.
9. **Incident Reporting & Evidence Collection**: Voice notes with automatic transcription, photo evidence validation, and offline queueing.
10. **Officer Incident Verification Workflow**: Spatial duplicate detection, on-site field verification, PWD action logging, and status tracking.
11. **Alerts & High-Priority Notifications**: Urgency-ranked broadcast banners, SMS/Push preferences, and driver acknowledgment tracking.
12. **AI Risk Prediction & Explainability Engine**: Gradient boosting risk scoring (0–100), model registry, and human-interpretable SHAP contributing factors.
13. **Weather & Multi-Hazard Disaster Intelligence**: IMD rainfall telemetry, Doppler radar composite feeds, flood alerts, and landslide warnings.
14. **Logistics & Cold-Chain Supply Network**: Strategic warehouse hubs, essential commodity shipments, temperature logging, and delivery tracking.
15. **Cascading Disruption & Impact Engine**: Graph-based node/edge traversal predicting downstream vehicle bottlenecks, hospital supply delays, and district isolation.
16. **Government Command Center**: Live inter-state operational oversight, real-time KPI feeds, and multi-corridor incident management.
17. **AI Copilot & Voice/NLP Assistant**: Text and microphone speech interface grounded strictly in verified platform data with tool calling.
18. **Satellite & Remote-Sensing Intelligence**: Multi-temporal change detection for floods and landslides with confidence scoring.
19. **Digital Twin Network**: Graph-based live network model with bidirectional dependency tracing and historical state snapshots.
20. **Simulation / What-If Engine**: Isolated hypothetical scenario execution (road washouts, bridge collapses) without mutating live operational tables.
21. **Resilience & Infrastructure Planning**: Asset criticality rankings, single-point-of-failure index, and priority reinforcement recommendations.
22. **Analytics, Audit Reports & Decision Support**: Trend visualizations, executive decision cards, and downloadable audit CSV reports.

---

## 4. Stakeholder Demonstration Personas & Credentials

The platform is pre-seeded with representative personas for guided stakeholder evaluation:

| Role | Email / Phone | Password | Key Capabilities & Demonstration Focus |
| :--- | :--- | :--- | :--- |
| **Driver (Field Carrier)** | `driver.biren@nermargdarshak.in` | `Driver@Pass123` | Active NH-6 mountain route, live GPS pinging, voice incident reporting, offline queueing |
| **Field Officer (SDRF / PWD)** | `officer.tawang@nermargdarshak.gov.in` | `Officer@Tawang2026` | Incident verification queue, spatial duplicate checks, on-site earthmover logging |
| **District Admin (Kamrup)** | `district.kamrup@nermargdarshak.gov.in` | `Admin@Kamrup2026` | District vehicle-to-driver dispatch, local hospital relief shelters, emergency alerts |
| **Central Admin (NER-Wide)** | `admin@nermargdarshak.gov.in` | `Admin@NER2026` | 8-state multi-corridor command center, What-If simulation, resilience scoring, audit reports |
| **Citizen (Public Transit)** | `citizen.gangtok@nermargdarshak.in` | `Citizen@Pass123` | Public road hazard advisories, detour alerts, civilian emergency SOS reporting |

---

## 5. Quick Start & Docker Deployment

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- Node.js 20+ (for local frontend development)
- Python 3.11+ with GDAL (for local backend development)

### One-Click Production Deployment (Docker Compose)
```bash
# Clone the repository
git clone https://github.com/NER-MargDarshak/platform.git
cd platform

# Start all containers in production mode
docker-compose -f docker-compose.prod.yml up -d --build

# Verify container health
docker ps
```

The services will be accessible at:
- **Web Platform Frontend**: `http://localhost:3000`
- **FastAPI Backend REST API**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **System Health Diagnostics**: `http://localhost:8000/api/v1/system/status`

### Local Development Setup

#### 1. Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend (Next.js 16 + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Automated Testing & Verification

The platform is backed by an automated test suite covering all 22 subsystems:

```bash
cd backend
pytest tests/ -v
```

### Test Suite Summary (**102 / 102 Tests Passing - 100%**):
- `tests/test_auth_rbac.py` (8 tests): Multi-role authentication, password security, duplicate prevention.
- `tests/test_admin_user_management.py` (2 tests): User provisioning, role hierarchy, vehicle assignments.
- `tests/test_master_data_management.py` (2 tests): Facility CRUD, versioning, soft-archiving, bulk imports.
- `tests/test_integration_hub.py` (2 tests): Connector adapters, health monitoring, on-demand synchronization.
- `tests/test_gis_map.py` & `test_live_gis_map.py` (13 tests): Spatial math, road status, bounding boxes, emergency facilities.
- `tests/test_live_gps_tracking.py` (5 tests): Telemetry pinging, speed jumps, DOP filtering, offline sync.
- `tests/test_smart_routing.py` & `test_smart_routing_engine.py` (7 tests): Multi-candidate routes, deviation alerts.
- `tests/test_driver_trips.py` & `test_my_route_trips.py` (5 tests): Trip state transitions, GPS linkages.
- `tests/test_driver_incident_reporting.py` & `test_incident_verification.py` (11 tests): Voice notes, spatial duplicate detection, officer verification.
- `tests/test_driver_alerts.py` & `test_alerts_notifications.py` (8 tests): Priority broadcast, driver acknowledgment.
- `tests/test_risk_prediction.py` & `test_ai_risk_intelligence.py` (3 tests): Gradient boosting risk models, SHAP explainability.
- `tests/test_weather_disaster_intelligence.py` (4 tests): IMD radar composites, rainfall telemetry, disaster alerts.
- `tests/test_logistics_intelligence.py` (3 tests): Warehouse hubs, cold-chain shipments, status updates.
- `tests/test_impact_cascading_engine.py` (3 tests): Graph traversal, vehicle bottleneck propagation, delay estimates.
- `tests/test_government_command_center.py` (2 tests): Multi-corridor oversight, inter-state KPI aggregation.
- `tests/test_satellite_intelligence.py` (3 tests): Optical/SAR change detection, landslide & flood anomalies.
- `tests/test_digital_twin_network.py` (3 tests): Network graph nodes, dependency chains, state snapshots.
- `tests/test_simulation_what_if.py` (2 tests): Isolated scenario execution, alternative paths, delay modeling.
- `tests/test_resilience_planning.py` (2 tests): Resilience scoring, bottleneck rankings, criticality index.
- `tests/test_analytics_reports.py` (2 tests): KPI aggregations, decision support, downloadable CSV reports.
- `tests/test_e2e_production_workflows.py` (2 tests): Master multi-role end-to-end operational workflows.

---

## 7. Data Provenance & AI Governance Disclaimers

- **Human-in-the-Loop Governance**: AI models provide explainable hazard predictions, optimal rerouting suggestions, and cascading disruption models for decision support. High-impact government actions (road closures, SDRF mobilization, corridor evacuations) require verified authorization by designated government officers.
- **Data Provenance**: External datasets are attributed to official sources (**India Meteorological Department**, **ISRO NRSC Bhuvan**, **MoRTH**, **NDMA Sachet**, and **State Police Transport Directorates**). Where live feeds are restricted during demonstration, realistic simulated telemetry is utilized and explicitly tagged with `[DEMO / SIMULATED DATA]`.

---

## 8. Backup & Disaster Recovery Procedures

- **Database Backup**:
  ```bash
  docker exec -t nermargdarshak_prod_db pg_dump -U postgres -d nermargdarshak -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Database Restoration**:
  ```bash
  docker exec -i nermargdarshak_prod_db pg_restore -U postgres -d nermargdarshak -v /var/lib/postgresql/data/<BACKUP_FILE>.dump
  ```
- **Redis State Persistence**: AOF (Append-Only File) and RDB snapshots are configured with volume persistence in `/data`.

---

**NER–MargDarshak — Empowering Resilience, Connectivity, and Accessibility across the North Eastern Region.**

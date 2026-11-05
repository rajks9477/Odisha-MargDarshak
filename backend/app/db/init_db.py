from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.audit import AuditLog
from app.models.token import RefreshToken, PasswordResetToken
from app.models.driver import (
    DriverProfile,
    Vehicle,
    Trip,
    TripEvent,
    DriverAvailability,
    VehicleStatus,
    TripStatus,
    TripPriority,
    TripStatusHistory,
)
from app.models.alert import (
    DriverAlert,
    NotificationDelivery,
    DriverNotificationPreference,
    AlertSeverity,
    AlertType,
    AlertStatus,
)
from app.models.gis import (
    Road,
    Bridge,
    District,
    Incident,
    DriverCurrentLocation,
    LocationHistory,
    RoadStatus,
    IncidentType,
    IncidentSeverity,
)
from app.models.infrastructure import (
    Infrastructure,
    InfrastructureType,
    InfrastructureStatus,
)
from app.models.tracking import (
    TrackingSession,
    SessionLocationPing,
    TrackingStatus,
)
from app.models.incident import (
    IncidentReport,
    IncidentEvidence,
    IncidentAuditLog,
    IncidentType as IncidentReportType,
    IncidentSeverity as IncidentReportSeverity,
    IncidentStatus as IncidentReportStatus,
)
from app.models.route import (
    PlannedRoute,
    RouteSegment,
    RouteEvent,
    RouteType,
    RouteRiskLevel,
)
from app.models.risk import (
    WeatherObservation,
    TerrainFeature,
    RoadConditionObservation,
    RiskPrediction,
    ModelRegistryEntry,
    RiskLevelEnum,
    ModelStatusEnum,
)
from app.models.weather import DisasterAlertEvent
from app.models.logistics import WarehouseHub, Shipment, ShipmentAuditLog
from app.models.impact import ImpactAnalysisRecord
from app.models.satellite import SatelliteSceneRecord, SatelliteChangeDetectionRecord
from app.models.digital_twin import DigitalTwinNetworkNode, DigitalTwinSnapshotRecord
from app.models.simulation import SimulationScenarioRecord, SimulationResultRecord
from app.models.resilience import ResilienceAssetRecord
from app.models.analytics import GeneratedReportRecord
from app.models.master_data import MasterFacilityRecord
from app.models.integration import ExternalConnectorRecord, IngestionBatchRecord

# Complete List of all 30 Districts of Odisha with Headquarters and Centroids
ODISHA_30_DISTRICTS = [
    {"id": "DIST-OD-ANGUL", "name": "Angul", "hq": "Angul", "lat": 20.8444, "lon": 85.1511},
    {"id": "DIST-OD-BALANGIR", "name": "Balangir", "hq": "Balangir", "lat": 20.7109, "lon": 83.4862},
    {"id": "DIST-OD-BALASORE", "name": "Balasore", "hq": "Balasore", "lat": 21.4934, "lon": 86.9135},
    {"id": "DIST-OD-BARGARH", "name": "Bargarh", "hq": "Bargarh", "lat": 21.3331, "lon": 83.6190},
    {"id": "DIST-OD-BHADRAK", "name": "Bhadrak", "hq": "Bhadrak", "lat": 21.0574, "lon": 86.4959},
    {"id": "DIST-OD-BOUDH", "name": "Boudh", "hq": "Boudh", "lat": 20.8411, "lon": 84.3267},
    {"id": "DIST-OD-CUTTACK", "name": "Cuttack", "hq": "Cuttack", "lat": 20.4625, "lon": 85.8828},
    {"id": "DIST-OD-DEOGARH", "name": "Deogarh", "hq": "Deogarh", "lat": 21.5333, "lon": 84.7333},
    {"id": "DIST-OD-DHENKANAL", "name": "Dhenkanal", "hq": "Dhenkanal", "lat": 20.6622, "lon": 85.5975},
    {"id": "DIST-OD-GAJAPATI", "name": "Gajapati", "hq": "Paralakhemundi", "lat": 18.7750, "lon": 84.0920},
    {"id": "DIST-OD-GANJAM", "name": "Ganjam", "hq": "Chhatrapur", "lat": 19.3547, "lon": 84.9882},
    {"id": "DIST-OD-JAGATSINGHPUR", "name": "Jagatsinghpur", "hq": "Jagatsinghpur", "lat": 20.2662, "lon": 86.1718},
    {"id": "DIST-OD-JAJPUR", "name": "Jajpur", "hq": "Panikoili", "lat": 20.8504, "lon": 86.3333},
    {"id": "DIST-OD-JHARSUGUDA", "name": "Jharsuguda", "hq": "Jharsuguda", "lat": 21.8554, "lon": 84.0063},
    {"id": "DIST-OD-KALAHANDI", "name": "Kalahandi", "hq": "Bhawanipatna", "lat": 19.9075, "lon": 83.1644},
    {"id": "DIST-OD-KANDHAMAL", "name": "Kandhamal", "hq": "Phulbani", "lat": 20.4789, "lon": 84.2339},
    {"id": "DIST-OD-KENDRAPARA", "name": "Kendrapara", "hq": "Kendrapara", "lat": 20.5004, "lon": 86.4230},
    {"id": "DIST-OD-KEONJHAR", "name": "Kendujhar (Keonjhar)", "hq": "Keonjhar", "lat": 21.6289, "lon": 85.5817},
    {"id": "DIST-OD-KHORDHA", "name": "Khordha", "hq": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245},
    {"id": "DIST-OD-KORAPUT", "name": "Koraput", "hq": "Koraput", "lat": 18.8135, "lon": 82.7123},
    {"id": "DIST-OD-MALKANGIRI", "name": "Malkangiri", "hq": "Malkangiri", "lat": 18.3436, "lon": 81.8974},
    {"id": "DIST-OD-MAYURBHANJ", "name": "Mayurbhanj", "hq": "Baripada", "lat": 21.9322, "lon": 86.7262},
    {"id": "DIST-OD-NABARANGPUR", "name": "Nabarangpur", "hq": "Nabarangpur", "lat": 19.2315, "lon": 82.5504},
    {"id": "DIST-OD-NAYAGARH", "name": "Nayagarh", "hq": "Nayagarh", "lat": 20.1250, "lon": 85.1050},
    {"id": "DIST-OD-NUAPADA", "name": "Nuapada", "hq": "Nuapada", "lat": 20.8333, "lon": 82.5333},
    {"id": "DIST-OD-PURI", "name": "Puri", "hq": "Puri", "lat": 19.8135, "lon": 85.8312},
    {"id": "DIST-OD-RAYAGADA", "name": "Rayagada", "hq": "Rayagada", "lat": 19.1719, "lon": 83.4163},
    {"id": "DIST-OD-SAMBALPUR", "name": "Sambalpur", "hq": "Sambalpur", "lat": 21.4669, "lon": 83.9812},
    {"id": "DIST-OD-SUBARNAPUR", "name": "Subarnapur", "hq": "Sonepur", "lat": 20.8394, "lon": 83.9169},
    {"id": "DIST-OD-SUNDARGARH", "name": "Sundargarh", "hq": "Rourkela", "lat": 22.1200, "lon": 84.0300},
]

def make_box_polygon(lon: float, lat: float, span_x: float = 0.25, span_y: float = 0.25) -> str:
    x1, y1 = round(lon - span_x, 4), round(lat - span_y, 4)
    x2, y2 = round(lon + span_x, 4), round(lat - span_y, 4)
    x3, y3 = round(lon + span_x, 4), round(lat + span_y, 4)
    x4, y4 = round(lon - span_x, 4), round(lat + span_y, 4)
    return f"[[[{x1}, {y1}], [{x2}, {y2}], [{x3}, {y3}], [{x4}, {y4}], [{x1}, {y1}]]]"

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE incident_reports ADD COLUMN location_source VARCHAR(20) DEFAULT 'GPS'"))
        except Exception:
            pass
    
    async with AsyncSessionLocal() as session:
        # Check if driver biren is already seeded
        result = await session.execute(select(User).filter(User.email == "driver.biren@odishamargdarshak.in"))
        driver_user = result.scalars().first()

        if not driver_user:
            # 1. Seed Core Persona Users for Odisha Margdarshak
            central_admin = User(
                name="Shri Asit Tripathy (Director - State Logistics Command)",
                email="admin@odishamargdarshak.gov.in",
                phone="9876543210",
                password_hash=get_password_hash("Admin@Odisha2026"),
                role=UserRole.CENTRAL_ADMIN,
                status=UserStatus.ACTIVE,
                department="Commerce & Transport Department / OSDMA",
                state="Odisha",
                district="Khordha",
                employee_id="ODI-OSDMA-001",
                designation="Director Regional Logistics Command",
                verified_at=datetime.now(timezone.utc),
            )
            district_admin = User(
                name="Dr. Priyadarshi Mohapatra (ADC / District Logistics Nodal)",
                email="district.khordha@odishamargdarshak.gov.in",
                phone="9876543211",
                password_hash=get_password_hash("Admin@Khordha2026"),
                role=UserRole.DISTRICT_ADMIN,
                status=UserStatus.ACTIVE,
                department="District Disaster Management Authority (DDMA Khordha)",
                state="Odisha",
                district="Khordha",
                employee_id="OD-DDMA-KD-102",
                designation="Additional Deputy Commissioner & ADM",
                verified_at=datetime.now(timezone.utc),
            )
            field_officer = User(
                name="Er. Soumya Ranjan Nayak (Executive Engineer PWD)",
                email="officer.koraput@odishamargdarshak.gov.in",
                phone="9876543212",
                password_hash=get_password_hash("Officer@Koraput2026"),
                role=UserRole.FIELD_OFFICER,
                status=UserStatus.ACTIVE,
                department="Works Department (PWD Roads Odisha)",
                state="Odisha",
                district="Koraput",
                employee_id="OD-PWD-KP-4091",
                designation="Executive Engineer (Ghat Roads & Infrastructure)",
                verified_at=datetime.now(timezone.utc),
            )
            pending_officer = User(
                name="Bikash Chandra Das (ODRAF Field Inspector)",
                email="officer.balasore@odishamargdarshak.gov.in",
                phone="9876543213",
                password_hash=get_password_hash("Officer@Balasore2026"),
                role=UserRole.FIELD_OFFICER,
                status=UserStatus.PENDING_APPROVAL,
                department="Odisha Disaster Rapid Action Force (ODRAF)",
                state="Odisha",
                district="Balasore",
                employee_id="OD-ODRAF-BL-1102",
                designation="Coastal Emergency Response Inspector",
            )
            driver_user = User(
                name="Biren Behera (Essential Commodities Carrier)",
                email="driver.biren@odishamargdarshak.in",
                phone="9876543214",
                password_hash=get_password_hash("Driver@Pass123"),
                role=UserRole.DRIVER,
                status=UserStatus.ACTIVE,
                state="Odisha",
                district="Cuttack",
                employee_id="OD-DRV-8821",
                designation="Heavy Commercial Vehicle Operator",
                verified_at=datetime.now(timezone.utc),
            )
            citizen_user = User(
                name="Rashmita Sahoo",
                email="citizen.bhubaneswar@odishamargdarshak.in",
                phone="9876543215",
                password_hash=get_password_hash("Citizen@Pass123"),
                role=UserRole.CITIZEN,
                status=UserStatus.ACTIVE,
                state="Odisha",
                district="Khordha",
                designation="Resident Citizen / Local Commuter",
                verified_at=datetime.now(timezone.utc),
            )

            session.add_all([central_admin, district_admin, field_officer, pending_officer, driver_user, citizen_user])
            await session.flush()

        # 2. Check Vehicle
        v_res = await session.execute(select(Vehicle).filter(Vehicle.vehicle_number == "OD-05-GC-9104"))
        vehicle = v_res.scalars().first()
        if not vehicle:
            vehicle = Vehicle(
                vehicle_number="OD-05-GC-9104",
                vehicle_type="Heavy Commercial Reefer (HCV)",
                model="Tata Prima 2830.K (Euro VI)",
                capacity_tonnes=16.5,
                fuel_type="Diesel + DEF",
                status=VehicleStatus.IN_TRANSIT,
                assigned_driver_id=driver_user.id,
                district="Khordha",
                state="Odisha",
                department="Food Supplies & Consumer Welfare Department, Odisha",
                fitness_valid_until=datetime.now(timezone.utc) + timedelta(days=280),
            )
            session.add(vehicle)
            await session.flush()

        # 3. Check Driver Profile
        dp_res = await session.execute(select(DriverProfile).filter(DriverProfile.user_id == driver_user.id))
        driver_profile = dp_res.scalars().first()
        if not driver_profile:
            driver_profile = DriverProfile(
                user_id=driver_user.id,
                license_number="OD-0520180092415",
                license_expiry=datetime.now(timezone.utc) + timedelta(days=730),
                experience_years=8,
                availability=DriverAvailability.ON_TRIP,
                current_location_name="NH-16 Bhubaneswar-Cuttack Twin City Corridor",
                assigned_vehicle_id=vehicle.id,
                emergency_contact="+91 9437012345 (State Logistics Control, Bhubaneswar)",
                blood_group="B+",
                last_active_at=datetime.now(timezone.utc),
            )
            session.add(driver_profile)
            await session.flush()

        # 4. Check Trips across Odisha Arterial Networks
        now = datetime.now(timezone.utc)
        t1_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-ODI-2026-0891"))
        trip1 = t1_res.scalars().first()
        if not trip1:
            trip1 = Trip(
                id="TRIP-ODI-2026-0891",
                trip_number="TRIP-ODI-2026-0891",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-8819",
                origin_name="Bhubaneswar Central Medical Supply Depot, Odisha",
                destination_name="Koraput SLN Medical College & Hospital, Odisha",
                corridor_name="NH-16 & NH-26 Southern Mountain Corridor",
                priority=TripPriority.CRITICAL_EMERGENCY,
                cargo_type="Essential Medicines & Child Vaccines",
                cargo_weight_tonnes=5.2,
                distance_km=495.0,
                status=TripStatus.ASSIGNED,
                scheduled_start=now + timedelta(hours=1),
                actual_start=None,
                actual_end=None,
                start_latitude=20.296,
                start_longitude=85.824,
                end_latitude=18.813,
                end_longitude=82.712,
                estimated_arrival=now + timedelta(hours=9),
                notes="Priority cold-chain consignment. Maintain refrigeration temp between 2°C - 8°C. Sunabeda / Koraput Ghat road clearance verified.",
                created_at=now - timedelta(hours=1),
            )
            session.add(trip1)

        t2_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-ODI-2026-0902"))
        trip2 = t2_res.scalars().first()
        if not trip2:
            trip2 = Trip(
                id="TRIP-ODI-2026-0902",
                trip_number="TRIP-ODI-2026-0902",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-1044",
                origin_name="Cuttack Central Food Granary Depot, Odisha",
                destination_name="Balasore Coastal Supply Terminal, Odisha",
                corridor_name="NH-16 Coastal Trunk Line",
                priority=TripPriority.HIGH_PRIORITY,
                cargo_type="Fortified Rice & Emergency Food Rations",
                cargo_weight_tonnes=12.0,
                distance_km=172.0,
                status=TripStatus.ASSIGNED,
                scheduled_start=now + timedelta(days=1),
                actual_start=None,
                actual_end=None,
                notes="Assigned for upcoming dispatch. Awaiting driver confirmation.",
                created_at=now - timedelta(hours=1),
            )
            session.add(trip2)

        t3_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-ODI-2026-0744"))
        if not t3_res.scalars().first():
            trip3 = Trip(
                id="TRIP-ODI-2026-0744",
                trip_number="TRIP-ODI-2026-0744",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-0391",
                origin_name="Paradip Port Cargo Terminal, Odisha",
                destination_name="AIIMS Bhubaneswar Critical Care Depot, Odisha",
                corridor_name="NH-53 & NH-16 Port Expressway",
                priority=TripPriority.STANDARD,
                cargo_type="Liquid Medical Oxygen & Trauma Surgical Kits",
                cargo_weight_tonnes=8.5,
                distance_km=108.0,
                status=TripStatus.COMPLETED,
                scheduled_start=now - timedelta(days=2),
                actual_start=now - timedelta(days=2),
                actual_end=now - timedelta(days=2, hours=-3),
                start_latitude=20.316,
                start_longitude=86.611,
                end_latitude=20.296,
                end_longitude=85.824,
                notes="Delivered on time with zero cold-chain excursions.",
                created_at=now - timedelta(days=3),
            )
            session.add(trip3)

        # 5. Check Driver Alerts
        a_res = await session.execute(select(DriverAlert).filter(DriverAlert.title.like("%Baitarani%")))
        if not a_res.scalars().first():
            alerts = [
                DriverAlert(
                    id="ALT-ODI-CRIT-01",
                    title="CRITICAL: Coastal Flood Inundation & Bridge Approach Overflow",
                    message="Baitarani river overflow has inundated both lanes near Akhuapada Bridge KM-118 (Bhadrak district). Works Dept diversion in effect via Panikoili.",
                    severity=AlertSeverity.CRITICAL,
                    type=AlertType.FLOOD_WARNING,
                    source="OSDMA_BHADRAK_SEOC",
                    driver_id=driver_user.id,
                    road_id="NH-16-COASTAL-01",
                    road_name="NH-16 Coastal Trunk Spine (Balasore - Bhadrak - Cuttack)",
                    location_name="Akhuapada Baitarani Crossing, Bhadrak",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(minutes=15),
                ),
                DriverAlert(
                    id="ALT-ODI-HIGH-02",
                    title="HIGH: Eastern Ghats Landslide & Hill Slush Warning",
                    message="Loose rockfall and mud accumulation reported on Kalinga Ghat hairpins (NH-59). Heavy commercial vehicle movement restricted to single lane.",
                    severity=AlertSeverity.HIGH,
                    type=AlertType.LANDSLIDE_WARNING,
                    source="ODISHA_WORKS_PWD",
                    driver_id=None,
                    road_id="NH-59-KALINGA-01",
                    road_name="NH-59 Kalinga Ghat Pass (Bhanjanagar - Phulbani)",
                    location_name="Kalinga Ghat Summit, Kandhamal",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(minutes=45),
                ),
                DriverAlert(
                    id="ALT-ODI-MED-03",
                    title="MEDIUM: Priority Green Corridor for Medical Oxygen Carriers",
                    message="Medical oxygen carriers from Paradip Port to AIIMS Bhubaneswar have dedicated zero-wait clearance through Cuttack toll plazas.",
                    severity=AlertSeverity.MEDIUM,
                    type=AlertType.GOVERNMENT_DIRECTIVE,
                    source="STATE_LOGISTICS_CELL_BBSR",
                    driver_id=None,
                    road_id="NH-53-PARADIP-01",
                    road_name="NH-53 Paradip Port Expressway (Paradip - Cuttack)",
                    location_name="Manguli Toll Plaza, Cuttack",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(hours=2),
                ),
                DriverAlert(
                    id="ALT-ODI-INFO-04",
                    title="INFO: Bay of Bengal Cyclone Warning & Coastal Squall Advisory",
                    message="Deep depression approaching Odisha coast. Gusty winds (65-75 km/h) expected between Puri and Chandipur. Drive with reduced speed.",
                    severity=AlertSeverity.INFO,
                    type=AlertType.SYSTEM_NOTICE,
                    source="IMD_BHUBANESWAR_RADAR",
                    driver_id=None,
                    road_id="NH-16-COASTAL-01",
                    road_name="NH-16 Coastal Trunk Spine",
                    location_name="Puri-Konark Coastal Zone",
                    status=AlertStatus.READ,
                    is_read=True,
                    is_acknowledged=False,
                    read_at=now - timedelta(hours=1),
                    created_at=now - timedelta(hours=3),
                ),
            ]
            session.add_all(alerts)

            for alt in alerts:
                deliv = NotificationDelivery(
                    alert_id=alt.id,
                    channel="IN_APP",
                    delivery_status="DELIVERED",
                    sent_at=alt.created_at,
                    delivered_at=alt.created_at,
                    read_at=alt.read_at,
                )
                session.add(deliv)

            # Driver Notification Preference
            p_res = await session.execute(select(DriverNotificationPreference).filter(DriverNotificationPreference.driver_id == driver_user.id))
            if not p_res.scalars().first():
                pref = DriverNotificationPreference(
                    driver_id=driver_user.id,
                    language="or-IN",
                    allow_traffic_updates=True,
                    allow_trip_updates=True,
                    allow_weather_warnings=True,
                    push_enabled=True,
                    sms_enabled=True,
                    voice_enabled=True,
                )
                session.add(pref)

        # 6. Seed GIS Roads (GeoJSON LineStrings for Odisha National & State Corridors)
        r_res = await session.execute(select(Road).filter(Road.id == "NH-16-COASTAL-01"))
        if not r_res.scalars().first():
            roads = [
                Road(
                    id="NH-16-COASTAL-01",
                    road_name="NH-16 Coastal Expressway (Balasore - Bhadrak - Cuttack - Bhubaneswar - Berhampur)",
                    road_number="NH-16",
                    road_type="National Highway",
                    geometry_json="[[86.91, 21.49], [86.50, 21.06], [86.15, 20.85], [85.88, 20.46], [85.82, 20.30], [85.62, 20.18], [84.79, 19.32]]",
                    district_id="DIST-OD-KHORDHA",
                    district_name="Khordha",
                    state="Odisha",
                    status=RoadStatus.YELLOW,
                    status_reason="Moderate rain and surface runoff near Baitarani basin. Maintain 50 km/h.",
                    average_speed_kmh=55.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-55-INDUSTRIAL-01",
                    road_name="NH-55 Central Industrial Corridor (Cuttack - Dhenkanal - Angul - Sambalpur)",
                    road_number="NH-55",
                    road_type="National Highway",
                    geometry_json="[[85.88, 20.46], [85.60, 20.66], [85.15, 20.84], [84.35, 21.05], [83.98, 21.47]]",
                    district_id="DIST-OD-ANGUL",
                    district_name="Angul",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    status_reason="All-weather 4-lane stretch open with smooth commercial movement.",
                    average_speed_kmh=60.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-53-WESTERN-01",
                    road_name="NH-53 Sambalpur-Deogarh-Bargarh Kolkata-Mumbai Lifeline",
                    road_number="NH-53",
                    road_type="National Highway",
                    geometry_json="[[83.62, 21.33], [83.98, 21.47], [84.73, 21.53], [85.20, 21.58], [85.58, 21.63]]",
                    district_id="DIST-OD-SAMBALPUR",
                    district_name="Sambalpur",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    status_reason="Open with green priority corridor for interstate logistics.",
                    average_speed_kmh=65.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-26-SOUTHERN-01",
                    road_name="NH-26 Western-Southern Lifeline (Bargarh - Balangir - Bhawanipatna - Koraput)",
                    road_number="NH-26",
                    road_type="National Highway",
                    geometry_json="[[83.62, 21.33], [83.49, 20.71], [83.16, 19.91], [82.71, 18.81], [82.80, 18.70]]",
                    district_id="DIST-OD-KORAPUT",
                    district_name="Koraput",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    status_reason="Ghat sections clear; speed advisory in hairpin turns.",
                    average_speed_kmh=48.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-326-GHATS-01",
                    road_name="NH-326 Southern Eastern Ghats Highway (Gajapati - Rayagada - Koraput - Malkangiri)",
                    road_number="NH-326",
                    road_type="National Highway",
                    geometry_json="[[84.09, 18.78], [83.42, 19.17], [82.71, 18.81], [82.15, 18.55], [81.90, 18.34]]",
                    district_id="DIST-OD-MALKANGIRI",
                    district_name="Malkangiri",
                    state="Odisha",
                    status=RoadStatus.ORANGE,
                    status_reason="Intermittent mud slush from hill cuttings. PWD patrol teams on site.",
                    average_speed_kmh=35.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-20-MINING-01",
                    road_name="NH-20 Northern Mining Trunk Corridor (Panikoili - Keonjhar - Rourkela)",
                    road_number="NH-20",
                    road_type="National Highway",
                    geometry_json="[[86.15, 20.85], [85.75, 21.20], [85.58, 21.63], [85.10, 21.90], [84.85, 22.26]]",
                    district_id="DIST-OD-KEONJHAR",
                    district_name="Kendujhar (Keonjhar)",
                    state="Odisha",
                    status=RoadStatus.RED,
                    status_reason="Active rockfall and debris accumulation at Kanjipani Ghat hairpin. Heavy freight halted.",
                    average_speed_kmh=0.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-53-PARADIP-01",
                    road_name="NH-53 Paradip Port Expressway (Cuttack - Paradip Port)",
                    road_number="NH-53",
                    road_type="National Highway",
                    geometry_json="[[85.88, 20.46], [86.17, 20.27], [86.61, 20.32]]",
                    district_id="DIST-OD-JAGATSINGHPUR",
                    district_name="Jagatsinghpur",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    status_reason="Dedicated freight lane open from Paradip Port berths to national grid.",
                    average_speed_kmh=65.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-57-CENTRAL-01",
                    road_name="NH-57 Central Inter-District Artery (Khordha - Nayagarh - Boudh - Sonepur - Balangir)",
                    road_number="NH-57",
                    road_type="National Highway",
                    geometry_json="[[85.62, 20.18], [85.11, 20.13], [84.33, 20.84], [83.92, 20.84], [83.49, 20.71]]",
                    district_id="DIST-OD-BOUDH",
                    district_name="Boudh",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    status_reason="All river crossings safe and clear.",
                    average_speed_kmh=52.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
            ]
            session.add_all(roads)

        # 7. Seed GIS Bridges across Major Odisha Rivers
        b_res = await session.execute(select(Bridge).filter(Bridge.id == "BRG-MAHANADI-01"))
        if not b_res.scalars().first():
            bridges = [
                Bridge(
                    id="BRG-MAHANADI-01",
                    bridge_name="Mahanadi Strategic Highway Bridge (Cuttack)",
                    road_id="NH-16-COASTAL-01",
                    latitude=20.485,
                    longitude=85.875,
                    district_name="Cuttack",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=70.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-BRAHMANI-01",
                    bridge_name="Brahmani Strategic River Bridge (Panikoili / Jajpur)",
                    road_id="NH-16-COASTAL-01",
                    latitude=20.860,
                    longitude=86.140,
                    district_name="Jajpur",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=65.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-BAITARANI-01",
                    bridge_name="Baitarani High-Level River Bridge (Akhuapada)",
                    road_id="NH-16-COASTAL-01",
                    latitude=21.045,
                    longitude=86.480,
                    district_name="Bhadrak",
                    state="Odisha",
                    status=RoadStatus.ORANGE,
                    capacity_tonnes=50.0,
                    water_level_status="HIGH",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-KATHAJODI-01",
                    bridge_name="Netaji Subhas Chandra Bose Kathajodi Bridge",
                    road_id="NH-16-COASTAL-01",
                    latitude=20.445,
                    longitude=85.860,
                    district_name="Cuttack",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=65.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-HIRAKUD-01",
                    bridge_name="Hirakud Reservoir Spillway Bridge",
                    road_id="NH-53-WESTERN-01",
                    latitude=21.520,
                    longitude=83.870,
                    district_name="Sambalpur",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=45.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-RUSHIKULYA-01",
                    bridge_name="Rushikulya Coastal Estuary Bridge (Chhatrapur)",
                    road_id="NH-16-COASTAL-01",
                    latitude=19.380,
                    longitude=85.030,
                    district_name="Ganjam",
                    state="Odisha",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=60.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
            ]
            session.add_all(bridges)

        # 8. Seed ALL 30 GIS District Polygons for Odisha
        d_res = await session.execute(select(District).filter(District.id == "DIST-OD-KHORDHA"))
        if not d_res.scalars().first():
            districts = []
            for d in ODISHA_30_DISTRICTS:
                districts.append(
                    District(
                        id=d["id"],
                        district_name=d["name"],
                        state="Odisha",
                        headquarters=d["hq"],
                        boundary_json=make_box_polygon(d["lon"], d["lat"]),
                        center_latitude=d["lat"],
                        center_longitude=d["lon"],
                    )
                )
            session.add_all(districts)

        # 9. Seed GIS Incidents
        i_res = await session.execute(select(Incident).filter(Incident.id == "INC-KANJIPANI-01"))
        if not i_res.scalars().first():
            incidents = [
                Incident(
                    id="INC-KANJIPANI-01",
                    incident_type=IncidentType.LANDSLIDE,
                    severity=IncidentSeverity.CRITICAL,
                    latitude=21.520,
                    longitude=85.480,
                    road_id="NH-20-MINING-01",
                    road_name="NH-20 Kanjipani Ghat Section",
                    district_name="Kendujhar (Keonjhar)",
                    state="Odisha",
                    status="ACTIVE",
                    description="Heavy mud and rockfall from ridge blocking both lanes. PWD excavators actively deployed.",
                    reported_by_role="FIELD_OFFICER",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=3),
                ),
                Incident(
                    id="INC-BAITARANI-01",
                    incident_type=IncidentType.FLASH_FLOOD,
                    severity=IncidentSeverity.CRITICAL,
                    latitude=21.057,
                    longitude=86.495,
                    road_id="NH-16-COASTAL-01",
                    road_name="NH-16 Akhuapada Sector",
                    district_name="Bhadrak",
                    state="Odisha",
                    status="ACTIVE",
                    description="Baitarani river backwater overflow across highway carriageway. Light vehicles halted.",
                    reported_by_role="DISTRICT_ADMIN",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=5),
                ),
                Incident(
                    id="INC-KALINGA-01",
                    incident_type=IncidentType.LANDSLIDE,
                    severity=IncidentSeverity.HIGH,
                    latitude=20.150,
                    longitude=84.450,
                    road_id="NH-59-KALINGA-01",
                    road_name="NH-59 Kalinga Ghat Pass",
                    district_name="Kandhamal",
                    state="Odisha",
                    status="ACTIVE",
                    description="Hill cutting collapse on hairpin curve #7. Heavy vehicles restricted.",
                    reported_by_role="FIELD_OFFICER",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=4),
                ),
            ]
            session.add_all(incidents)

        # 10. Seed Initial Driver Location
        dl_res = await session.execute(select(DriverCurrentLocation).filter(DriverCurrentLocation.driver_id == driver_user.id))
        if not dl_res.scalars().first():
            drv_loc = DriverCurrentLocation(
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                latitude=20.350,
                longitude=85.820,
                accuracy_meters=4.5,
                speed_kmh=52.0,
                heading_degrees=35.0,
                is_moving=True,
                nearest_road_name="NH-16 (Bhubaneswar - Cuttack Twin City Corridor)",
                last_updated=datetime.now(timezone.utc),
            )
            session.add(drv_loc)

        # 11. Seed Regional Infrastructure (Hospitals, Warehouses, Relief Centers, Fuel Depots)
        inf_res = await session.execute(select(Infrastructure).filter(Infrastructure.id == "INFRA-HOSP-BBSR-01"))
        if not inf_res.scalars().first():
            infrastructure_list = [
                Infrastructure(
                    id="INFRA-HOSP-BBSR-01",
                    name="AIIMS Bhubaneswar Apex Emergency Hospital",
                    type=InfrastructureType.HOSPITAL,
                    latitude=20.228,
                    longitude=85.776,
                    district_name="Khordha",
                    district_id="DIST-OD-KHORDHA",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="1,000 Beds • 24/7 Level-1 Trauma Centre",
                    contact_number="+91-674-2476789",
                    address="Sijua, Patrapada, Bhubaneswar, Odisha 751019",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-CTC-01",
                    name="SCB Medical College & Apex Trauma Hospital",
                    type=InfrastructureType.HOSPITAL,
                    latitude=20.478,
                    longitude=85.890,
                    district_name="Cuttack",
                    district_id="DIST-OD-CUTTACK",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="2,500 Beds • Comprehensive Critical Care",
                    contact_number="+91-671-2414004",
                    address="Manglabag, Cuttack, Odisha 753007",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-BER-01",
                    name="MKCG Medical College Hospital Berhampur",
                    type=InfrastructureType.HOSPITAL,
                    latitude=19.308,
                    longitude=84.811,
                    district_name="Ganjam",
                    district_id="DIST-OD-GANJAM",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="1,200 Beds • Southern Coastal Command Ward",
                    contact_number="+91-680-2292746",
                    address="Medical College Road, Berhampur, Odisha 760004",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-SAM-01",
                    name="VSSIMSAR Burla Super-Specialty Medical Hospital",
                    type=InfrastructureType.HOSPITAL,
                    latitude=21.498,
                    longitude=83.874,
                    district_name="Sambalpur",
                    district_id="DIST-OD-SAMBALPUR",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="1,100 Beds • Western Odisha Regional Trauma Centre",
                    contact_number="+91-663-2430768",
                    address="Burla, Sambalpur, Odisha 768017",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-KOR-01",
                    name="Saheed Laxman Nayak (SLN) Medical College & Hospital",
                    type=InfrastructureType.HOSPITAL,
                    latitude=18.825,
                    longitude=82.721,
                    district_name="Koraput",
                    district_id="DIST-OD-KORAPUT",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="500 High-Altitude & Tribal Ward Beds",
                    contact_number="+91-6852-250102",
                    address="Koraput Town, Odisha 764020",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-WH-PARADIP-01",
                    name="Paradip Port Multi-Modal Cargo Terminal & Grain Warehouse",
                    type=InfrastructureType.WAREHOUSE,
                    latitude=20.316,
                    longitude=86.611,
                    district_name="Jagatsinghpur",
                    district_id="DIST-OD-JAGATSINGHPUR",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="250,000 MT Strategic Grain & Mineral Storage",
                    contact_number="+91-6722-222046",
                    address="Port Area, Paradip, Odisha 754142",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-WH-MALGODOWN-01",
                    name="Cuttack Malgodown Regional Essential Grain Depots",
                    type=InfrastructureType.WAREHOUSE,
                    latitude=20.457,
                    longitude=85.892,
                    district_name="Cuttack",
                    district_id="DIST-OD-CUTTACK",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="50,000 MT Central Civil Supplies Reserve",
                    contact_number="+91-671-2601900",
                    address="Malgodown Railway Yard, Cuttack, Odisha 753003",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-RELIEF-OSDMA-01",
                    name="OSDMA Central Emergency Relief & Disaster Logistics Depot",
                    type=InfrastructureType.RELIEF_CENTER,
                    latitude=20.296,
                    longitude=85.824,
                    district_name="Khordha",
                    district_id="DIST-OD-KHORDHA",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="5,000 Evacuees • Ready-to-Eat Packets & Shelter Kits",
                    contact_number="+91-674-2395398",
                    address="Rajiv Bhawan, Bhubaneswar, Odisha 751001",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-FUEL-PARADIP-01",
                    name="Indian Oil Strategic Petroleum Reserve & Tanker Terminal",
                    type=InfrastructureType.FUEL_STATION,
                    latitude=20.301,
                    longitude=86.620,
                    district_name="Jagatsinghpur",
                    district_id="DIST-OD-JAGATSINGHPUR",
                    state="Odisha",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="500,000 Litres Strategic Diesel Reserve",
                    contact_number="+91-6722-220500",
                    address="IOCL Refinery Road, Paradip, Odisha 754141",
                    is_emergency_critical=True,
                    is_public=True,
                ),
            ]
            session.add_all(infrastructure_list)

        await session.commit()
        print("Initialized Odisha-MargDarshak complete GIS layers & All 30 Districts seed dataset.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_database())

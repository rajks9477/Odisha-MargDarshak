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

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe column migration for SQLite
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE incident_reports ADD COLUMN location_source VARCHAR(20) DEFAULT 'GPS'"))
        except Exception:
            pass
    
    async with AsyncSessionLocal() as session:
        # Check if driver biren is already seeded
        result = await session.execute(select(User).filter(User.email == "driver.biren@nermargdarshak.in"))
        driver_user = result.scalars().first()

        if not driver_user:
            # 1. Seed Users
            central_admin = User(
                name="Shri Rajesh Sharma (Director - Logistics)",
                email="admin@nermargdarshak.gov.in",
                phone="9876543210",
                password_hash=get_password_hash("Admin@NER2026"),
                role=UserRole.CENTRAL_ADMIN,
                status=UserStatus.ACTIVE,
                department="Ministry of Development of North Eastern Region (MDoNER)",
                state="Assam",
                district="Kamrup Metropolitan",
                employee_id="NER-MDoNER-001",
                designation="Director Regional Logistics Command",
                verified_at=datetime.now(timezone.utc),
            )
            district_admin = User(
                name="Dr. Ananya Baruah (ADC / District Logistics Nodal)",
                email="district.kamrup@nermargdarshak.gov.in",
                phone="9876543211",
                password_hash=get_password_hash("Admin@Kamrup2026"),
                role=UserRole.DISTRICT_ADMIN,
                status=UserStatus.ACTIVE,
                department="District Disaster Management Authority (DDMA)",
                state="Assam",
                district="Kamrup Metropolitan",
                employee_id="AS-DDMA-KM-102",
                designation="Additional Deputy Commissioner",
                verified_at=datetime.now(timezone.utc),
            )
            field_officer = User(
                name="Er. Tashi Norbu (Executive Engineer PWD)",
                email="officer.tawang@nermargdarshak.gov.in",
                phone="9876543212",
                password_hash=get_password_hash("Officer@Tawang2026"),
                role=UserRole.FIELD_OFFICER,
                status=UserStatus.ACTIVE,
                department="Public Works Department (PWD Roads)",
                state="Arunachal Pradesh",
                district="Tawang",
                employee_id="AR-PWD-TW-4091",
                designation="Executive Engineer (Border Roads)",
                verified_at=datetime.now(timezone.utc),
            )
            pending_officer = User(
                name="Lalthan Sanga (SDRF Field Inspector)",
                email="officer.aizawl@nermargdarshak.gov.in",
                phone="9876543213",
                password_hash=get_password_hash("Officer@Aizawl2026"),
                role=UserRole.FIELD_OFFICER,
                status=UserStatus.PENDING_APPROVAL,
                department="State Disaster Response Force (SDRF)",
                state="Mizoram",
                district="Aizawl",
                employee_id="MZ-SDRF-AZ-1102",
                designation="Zonal Emergency Response Inspector",
            )
            driver_user = User(
                name="Biren Gogoi (Essential Commodities Carrier)",
                email="driver.biren@nermargdarshak.in",
                phone="9876543214",
                password_hash=get_password_hash("Driver@Pass123"),
                role=UserRole.DRIVER,
                status=UserStatus.ACTIVE,
                state="Assam",
                district="Dibrugarh",
                employee_id="NER-DRV-8821",
                designation="Heavy Commercial Vehicle Operator",
                verified_at=datetime.now(timezone.utc),
            )
            citizen_user = User(
                name="Rinzin Doma",
                email="citizen.gangtok@nermargdarshak.in",
                phone="9876543215",
                password_hash=get_password_hash("Citizen@Pass123"),
                role=UserRole.CITIZEN,
                status=UserStatus.ACTIVE,
                state="Sikkim",
                district="Gangtok",
                designation="Resident Citizen / Local Commuter",
                verified_at=datetime.now(timezone.utc),
            )

            session.add_all([central_admin, district_admin, field_officer, pending_officer, driver_user, citizen_user])
            await session.flush()

        # 2. Check Vehicle
        v_res = await session.execute(select(Vehicle).filter(Vehicle.vehicle_number == "AS-01-GC-9104"))
        vehicle = v_res.scalars().first()
        if not vehicle:
            vehicle = Vehicle(
                vehicle_number="AS-01-GC-9104",
                vehicle_type="Heavy Commercial Reefer (HCV)",
                model="Tata Prima 2830.K (Euro VI)",
                capacity_tonnes=16.5,
                fuel_type="Diesel + DEF",
                status=VehicleStatus.IN_TRANSIT,
                assigned_driver_id=driver_user.id,
                district="Kamrup Metropolitan",
                state="Assam",
                department="Department of Food, Civil Supplies & Consumer Affairs",
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
                license_number="DL-0120180092415",
                license_expiry=datetime.now(timezone.utc) + timedelta(days=730),
                experience_years=8,
                availability=DriverAvailability.ON_TRIP,
                current_location_name="NH-6 Meghalaya-Assam Corridor",
                assigned_vehicle_id=vehicle.id,
                emergency_contact="+91 9435012345 (Guwahati Dispatch Control)",
                blood_group="B+",
                last_active_at=datetime.now(timezone.utc),
            )
            session.add(driver_profile)
            await session.flush()

        # 4. Check Trips (Active, Assigned, and Completed History)
        now = datetime.now(timezone.utc)
        t1_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-NER-2026-0891"))
        trip1 = t1_res.scalars().first()
        if not trip1:
            trip1 = Trip(
                id="TRIP-NER-2026-0891",
                trip_number="TRIP-NER-2026-0891",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-8819",
                origin_name="Guwahati Central Supply Depot, Assam",
                destination_name="Shillong Civil Hospital & Depot, Meghalaya",
                corridor_name="NH-6 Guwahati-Shillong Mountain Corridor",
                priority=TripPriority.CRITICAL_EMERGENCY,
                cargo_type="Essential Medicines & Baby Food",
                cargo_weight_tonnes=5.2,
                distance_km=98.0,
                status=TripStatus.ASSIGNED,
                scheduled_start=now + timedelta(hours=1),
                actual_start=None,
                actual_end=None,
                start_latitude=26.180,
                start_longitude=91.730,
                end_latitude=25.570,
                end_longitude=91.880,
                estimated_arrival=now + timedelta(hours=4),
                notes="Priority cold-chain consignment. Maintain refrigeration temp between 2°C - 8°C. Sonapur tunnel clearance verified.",
                created_at=now - timedelta(hours=1),
            )
            session.add(trip1)
        else:
            trip1.status = TripStatus.ASSIGNED
            trip1.actual_start = None
            trip1.actual_end = None
            trip1.pause_started_at = None

        t2_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-NER-2026-0902"))
        trip2 = t2_res.scalars().first()
        if not trip2:
            trip2 = Trip(
                id="TRIP-NER-2026-0902",
                trip_number="TRIP-NER-2026-0902",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-1044",
                origin_name="Silchar Food Depot, Assam",
                destination_name="Agartala Central Granary, Tripura",
                corridor_name="NH-8 Assam-Tripura Lifeline",
                priority=TripPriority.HIGH_PRIORITY,
                cargo_type="Grains & Fortified Wheat Flour",
                cargo_weight_tonnes=10.0,
                distance_km=254.0,
                status=TripStatus.ASSIGNED,
                scheduled_start=now + timedelta(days=1),
                actual_start=None,
                actual_end=None,
                notes="Assigned for upcoming dispatch. Awaiting driver confirmation.",
                created_at=now - timedelta(hours=1),
            )
            session.add(trip2)
        else:
            trip2.status = TripStatus.ASSIGNED
            trip2.actual_start = None
            trip2.actual_end = None

        t3_res = await session.execute(select(Trip).filter(Trip.trip_number == "TRIP-NER-2026-0744"))
        if not t3_res.scalars().first():
            trip3 = Trip(
                id="TRIP-NER-2026-0744",
                trip_number="TRIP-NER-2026-0744",
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                shipment_id="SHP-MED-0391",
                origin_name="Guwahati Airport Cargo Terminal, Assam",
                destination_name="Shillong Civil Hospital, Meghalaya",
                corridor_name="NH-6 Guwahati-Shillong Expressway",
                priority=TripPriority.STANDARD,
                cargo_type="Cold-chain Vaccine Vials",
                cargo_weight_tonnes=3.5,
                distance_km=102.0,
                status=TripStatus.COMPLETED,
                scheduled_start=now - timedelta(days=2),
                actual_start=now - timedelta(days=2),
                actual_end=now - timedelta(days=2, hours=-3),
                start_latitude=26.180,
                start_longitude=91.730,
                end_latitude=25.570,
                end_longitude=91.880,
                notes="Delivered on time with zero cold-chain excursions.",
                created_at=now - timedelta(days=3),
            )
            session.add(trip3)

        # 5. Check Driver Alerts
        a_res = await session.execute(select(DriverAlert).filter(DriverAlert.title.like("%Landslide%")))
        if not a_res.scalars().first():
            alerts = [
                DriverAlert(
                    id="ALT-NER-CRIT-01",
                    title="CRITICAL: Active Rockfall & Landslide Blockage",
                    message="Both lanes blocked near Sonapur Tunnel KM-142 due to severe rockfall. PWD earthmovers on site. Avoid approaching corridor until cleared.",
                    severity=AlertSeverity.CRITICAL,
                    type=AlertType.LANDSLIDE_WARNING,
                    source="DDMA_EAST_JAINTIA",
                    driver_id=driver_user.id,
                    road_id="NH-6-SONAPUR-01",
                    road_name="NH-6 Sonapur Highway Spine (Shillong - Silchar)",
                    location_name="Sonapur Tunnel Approach, East Jaintia Hills",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(minutes=15),
                ),
                DriverAlert(
                    id="ALT-NER-HIGH-02",
                    title="HIGH: Bridge Scour & Weight Restriction Warning",
                    message="Temporary 12-tonne gross weight limit imposed on Lubha River suspension bridge due to heavy flash flood runoff.",
                    severity=AlertSeverity.HIGH,
                    type=AlertType.BRIDGE_CLOSURE,
                    source="NER_HIGHWAYS_PWD",
                    driver_id=None,
                    road_id="NH-6-SONAPUR-01",
                    road_name="NH-6 Sonapur Highway Spine (Shillong - Silchar)",
                    location_name="Lubha River Crossing, Meghalaya",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(minutes=45),
                ),
                DriverAlert(
                    id="ALT-NER-MED-03",
                    title="MEDIUM: Priority Green Corridor at Border Checkpost",
                    message="Essential commodity carriers (Medical Supplies & Food Grains) have dedicated zero-wait fast track lane at Vairengte gate.",
                    severity=AlertSeverity.MEDIUM,
                    type=AlertType.GOVERNMENT_DIRECTIVE,
                    source="REGIONAL_DISPATCH_CELL",
                    driver_id=None,
                    road_id="NH-306-VAIRENGTE-01",
                    road_name="NH-306 South Corridor (Silchar - Vairengte - Aizawl)",
                    location_name="Vairengte Inter-State Gate",
                    status=AlertStatus.UNREAD,
                    is_read=False,
                    is_acknowledged=False,
                    created_at=now - timedelta(hours=2),
                ),
                DriverAlert(
                    id="ALT-NER-INFO-04",
                    title="INFO: Weather Alert - Heavy Fog Advisory",
                    message="Dense valley fog expected after 18:00 IST along Jowai-Ladrymbai stretch. Maintain low-beam headlights and reduce speed to 30 km/h.",
                    severity=AlertSeverity.INFO,
                    type=AlertType.SYSTEM_NOTICE,
                    source="IMD_REGIONAL_RADAR",
                    driver_id=None,
                    road_id="NH-6-SONAPUR-01",
                    road_name="NH-6 Sonapur Highway Spine (Shillong - Silchar)",
                    location_name="Jowai Mountain Ridge",
                    status=AlertStatus.READ,
                    is_read=True,
                    is_acknowledged=False,
                    read_at=now - timedelta(hours=1),
                    created_at=now - timedelta(hours=3),
                ),
            ]
            session.add_all(alerts)

            # Notification Delivery records
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
                    language="en-IN",
                    allow_traffic_updates=True,
                    allow_trip_updates=True,
                    allow_weather_warnings=True,
                    push_enabled=True,
                    sms_enabled=True,
                    voice_enabled=False,
                )
                session.add(pref)

        # 6. Seed GIS Roads (GeoJSON LineStrings with 4 accessibility statuses)
        r_res = await session.execute(select(Road).filter(Road.id == "NH-6-SONAPUR-01"))
        if not r_res.scalars().first():
            roads = [
                Road(
                    id="NH-6-SONAPUR-01",
                    road_name="NH-6 Sonapur Highway Spine (Shillong - Jowai - Silchar)",
                    road_number="NH-6",
                    road_type="National Highway",
                    geometry_json="[[91.88, 25.57], [92.05, 25.50], [92.20, 25.45], [92.36, 25.10], [92.65, 24.95], [92.79, 24.83]]",
                    district_id="DIST-ML-EAST-JAINTIA",
                    district_name="East Jaintia Hills",
                    state="Meghalaya",
                    status=RoadStatus.ORANGE,
                    status_reason="Mud accumulation near Sonapur tunnel approach. Heavy single-lane transit.",
                    average_speed_kmh=28.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-306-VAIRENGTE-01",
                    road_name="NH-306 South Corridor (Silchar - Vairengte - Aizawl)",
                    road_number="NH-306",
                    road_type="National Highway",
                    geometry_json="[[92.79, 24.83], [92.75, 24.50], [92.67, 24.22], [92.71, 23.73]]",
                    district_id="DIST-MZ-AIZAWL",
                    district_name="Aizawl",
                    state="Mizoram",
                    status=RoadStatus.GREEN,
                    status_reason="Open with green priority corridor for essential reefers.",
                    average_speed_kmh=45.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-10-SEVOKE-01",
                    road_name="NH-10 Teesta Corridor (Sevoke - Likuvir - Gangtok)",
                    road_number="NH-10",
                    road_type="National Highway",
                    geometry_json="[[88.46, 26.88], [88.43, 27.05], [88.59, 27.15], [88.61, 27.33]]",
                    district_id="DIST-SK-GANGTOK",
                    district_name="Gangtok",
                    state="Sikkim",
                    status=RoadStatus.RED,
                    status_reason="Active rockfall at 29th Mile Likuvir. Commercial vehicles stopped.",
                    average_speed_kmh=0.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-13-SELA-01",
                    road_name="NH-13 Trans-Arunachal Spine (Bhalukpong - Bomdila - Tawang)",
                    road_number="NH-13",
                    road_type="National Highway",
                    geometry_json="[[92.65, 27.01], [92.41, 27.35], [92.10, 27.50], [91.86, 27.58]]",
                    district_id="DIST-AR-TAWANG",
                    district_name="Tawang",
                    state="Arunachal Pradesh",
                    status=RoadStatus.GREEN,
                    status_reason="Sela Tunnel twin-tube clear and operational at 13,000 ft.",
                    average_speed_kmh=50.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
                Road(
                    id="NH-27-LUMDING-01",
                    road_name="NH-27 East-West Expressway (Guwahati - Nagaon - Lumding)",
                    road_number="NH-27",
                    road_type="National Highway",
                    geometry_json="[[91.73, 26.18], [92.15, 26.25], [92.68, 26.35], [93.18, 25.75]]",
                    district_id="DIST-AS-KAMRUP-METRO",
                    district_name="Kamrup Metropolitan",
                    state="Assam",
                    status=RoadStatus.YELLOW,
                    status_reason="Wet surface & intermittent fog in hill section. Drive with caution.",
                    average_speed_kmh=38.0,
                    is_bridge_section=False,
                    last_updated=datetime.now(timezone.utc),
                ),
            ]
            session.add_all(roads)

        # 7. Seed GIS Bridges
        b_res = await session.execute(select(Bridge).filter(Bridge.id == "BRG-SARAIGHAT-01"))
        if not b_res.scalars().first():
            bridges = [
                Bridge(
                    id="BRG-SARAIGHAT-01",
                    bridge_name="Saraighat Brahmaputra Strategic Bridge",
                    road_id="NH-27-LUMDING-01",
                    latitude=26.178,
                    longitude=91.685,
                    district_name="Kamrup Metropolitan",
                    state="Assam",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=65.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-SONAPUR-01",
                    bridge_name="Sonapur River Deep Gorge Viaduct",
                    road_id="NH-6-SONAPUR-01",
                    latitude=25.105,
                    longitude=92.365,
                    district_name="East Jaintia Hills",
                    state="Meghalaya",
                    status=RoadStatus.ORANGE,
                    capacity_tonnes=40.0,
                    water_level_status="HIGH",
                    last_inspected=datetime.now(timezone.utc),
                ),
                Bridge(
                    id="BRG-KOLASIB-01",
                    bridge_name="Kolasib Bailey Bridge",
                    road_id="NH-306-VAIRENGTE-01",
                    latitude=24.225,
                    longitude=92.675,
                    district_name="Kolasib",
                    state="Mizoram",
                    status=RoadStatus.GREEN,
                    capacity_tonnes=30.0,
                    water_level_status="NORMAL",
                    last_inspected=datetime.now(timezone.utc),
                ),
            ]
            session.add_all(bridges)

        # 8. Seed GIS District Polygons
        d_res = await session.execute(select(District).filter(District.id == "DIST-AS-KAMRUP-METRO"))
        if not d_res.scalars().first():
            districts = [
                District(
                    id="DIST-AS-KAMRUP-METRO",
                    district_name="Kamrup Metropolitan",
                    state="Assam",
                    headquarters="Guwahati",
                    boundary_json="[[[91.50, 26.05], [91.95, 26.05], [91.95, 26.30], [91.50, 26.30], [91.50, 26.05]]]",
                    center_latitude=26.18,
                    center_longitude=91.73,
                ),
                District(
                    id="DIST-ML-EAST-JAINTIA",
                    district_name="East Jaintia Hills",
                    state="Meghalaya",
                    headquarters="Khliehriat",
                    boundary_json="[[[92.15, 25.10], [92.65, 25.10], [92.65, 25.55], [92.15, 25.55], [92.15, 25.10]]]",
                    center_latitude=25.35,
                    center_longitude=92.36,
                ),
                District(
                    id="DIST-MZ-AIZAWL",
                    district_name="Aizawl",
                    state="Mizoram",
                    headquarters="Aizawl",
                    boundary_json="[[[92.50, 23.50], [92.95, 23.50], [92.95, 24.00], [92.50, 24.00], [92.50, 23.50]]]",
                    center_latitude=23.73,
                    center_longitude=92.71,
                ),
                District(
                    id="DIST-AR-TAWANG",
                    district_name="Tawang",
                    state="Arunachal Pradesh",
                    headquarters="Tawang",
                    boundary_json="[[[91.60, 27.40], [92.10, 27.40], [92.10, 27.80], [91.60, 27.80], [91.60, 27.40]]]",
                    center_latitude=27.58,
                    center_longitude=91.86,
                ),
            ]
            session.add_all(districts)

        # 9. Seed GIS Incidents
        i_res = await session.execute(select(Incident).filter(Incident.id == "INC-SONAPUR-01"))
        if not i_res.scalars().first():
            incidents = [
                Incident(
                    id="INC-SONAPUR-01",
                    incident_type=IncidentType.LANDSLIDE,
                    severity=IncidentSeverity.CRITICAL,
                    latitude=25.105,
                    longitude=92.365,
                    road_id="NH-6-SONAPUR-01",
                    road_name="NH-6 Sonapur Section",
                    district_name="East Jaintia Hills",
                    state="Meghalaya",
                    status="ACTIVE",
                    description="Heavy mud flow from mountain ridge blocking southbound carriageway. PWD JCB excavators engaged.",
                    reported_by_role="FIELD_OFFICER",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=3),
                ),
                Incident(
                    id="INC-LIKUVIR-01",
                    incident_type=IncidentType.LANDSLIDE,
                    severity=IncidentSeverity.CRITICAL,
                    latitude=27.050,
                    longitude=88.430,
                    road_id="NH-10-SEVOKE-01",
                    road_name="NH-10 29th Mile Likuvir",
                    district_name="Kalimpong / Sikkim Border",
                    state="Sikkim",
                    status="ACTIVE",
                    description="Boulders fell across both lanes. Complete stoppage of heavy multi-axle freight carriers.",
                    reported_by_role="DISTRICT_ADMIN",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=5),
                ),
            ]
            session.add_all(incidents)

        # 10. Seed Initial Driver Location
        dl_res = await session.execute(select(DriverCurrentLocation).filter(DriverCurrentLocation.driver_id == driver_user.id))
        if not dl_res.scalars().first():
            drv_loc = DriverCurrentLocation(
                driver_id=driver_user.id,
                vehicle_id=vehicle.id,
                latitude=25.570,
                longitude=91.880,
                accuracy_meters=4.5,
                speed_kmh=42.0,
                heading_degrees=145.0,
                is_moving=True,
                nearest_road_name="NH-6 (NH-6 Sonapur Highway Spine)",
                last_updated=datetime.now(timezone.utc),
            )
            session.add(drv_loc)

        # 11. Seed Regional Infrastructure (Hospitals, Warehouses, Relief Centers, Fuel Depots)
        inf_res = await session.execute(select(Infrastructure).filter(Infrastructure.id == "INFRA-HOSP-GUW-01"))
        if not inf_res.scalars().first():
            infrastructure_list = [
                Infrastructure(
                    id="INFRA-HOSP-GUW-01",
                    name="Guwahati Medical College & Emergency Hospital",
                    type=InfrastructureType.HOSPITAL,
                    latitude=26.158,
                    longitude=91.772,
                    district_name="Kamrup Metropolitan",
                    district_id="DIST-AS-KAMRUP-METRO",
                    state="Assam",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="850 Beds • 24/7 Level-1 Trauma Centre",
                    contact_number="+91-361-2529457",
                    address="Bhangagarh, Guwahati, Assam 781032",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-SHL-01",
                    name="Shillong Civil Hospital & Mountain Trauma Ward",
                    type=InfrastructureType.HOSPITAL,
                    latitude=25.572,
                    longitude=91.883,
                    district_name="East Khasi Hills",
                    district_id="DIST-ML-EAST-KHASI",
                    state="Meghalaya",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="450 Beds • Critical Care Unit",
                    contact_number="+91-364-2224100",
                    address="Secretariat Hills, Shillong, Meghalaya 793001",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-RELIEF-SONAPUR-01",
                    name="Sonapur Mountain Emergency Relief & PWD Base Depot",
                    type=InfrastructureType.RELIEF_CENTER,
                    latitude=25.105,
                    longitude=92.360,
                    district_name="East Jaintia Hills",
                    district_id="DIST-ML-EAST-JAINTIA",
                    state="Meghalaya",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="300 Evacuees • Emergency Rations & Blankets",
                    contact_number="+91-3655-230012",
                    address="NH-6 Highway Mile 42, Sonapur, Meghalaya",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-WH-SILCHAR-01",
                    name="Silchar Food Corporation & Essential Grain Warehouse",
                    type=InfrastructureType.WAREHOUSE,
                    latitude=24.833,
                    longitude=92.778,
                    district_name="Cachar",
                    district_id="DIST-AS-CACHAR",
                    state="Assam",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="10,000 MT Rice & Grain Buffer Storage",
                    contact_number="+91-3842-260190",
                    address="Tarapur Railway Goods Yard, Silchar, Assam 788003",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-FUEL-NUMALIGARH-01",
                    name="Numaligarh Emergency Fuel Reserve & Tanker Depot",
                    type=InfrastructureType.FUEL_STATION,
                    latitude=26.580,
                    longitude=93.750,
                    district_name="Golaghat",
                    district_id="DIST-AS-GOLAGHAT",
                    state="Assam",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="100,000 Litres Diesel Strategic Reserve",
                    contact_number="+91-3776-265500",
                    address="NH-715 Junction, Numaligarh, Assam",
                    is_emergency_critical=True,
                    is_public=True,
                ),
                Infrastructure(
                    id="INFRA-HOSP-TAWANG-01",
                    name="Khandro Drowa Tsangmu District Hospital Tawang",
                    type=InfrastructureType.HOSPITAL,
                    latitude=27.586,
                    longitude=91.865,
                    district_name="Tawang",
                    district_id="DIST-AR-TAWANG",
                    state="Arunachal Pradesh",
                    status=InfrastructureStatus.OPERATIONAL,
                    capacity_metric="120 High-Altitude Beds • Oxygen Plant",
                    contact_number="+91-3794-222214",
                    address="Cona Road, Tawang, Arunachal Pradesh 790104",
                    is_emergency_critical=True,
                    is_public=True,
                ),
            ]
            session.add_all(infrastructure_list)

        await session.commit()
        print("Initialized NER-MargDarshak complete GIS layers & Driver Location seed dataset.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_database())

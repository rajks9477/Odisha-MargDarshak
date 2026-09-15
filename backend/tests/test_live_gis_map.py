import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.init_db import init_database

@pytest.mark.asyncio
async def test_get_map_incidents_json_and_geojson():
    await init_database()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login Driver
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Incidents as Standard JSON
        json_resp = await ac.get("/api/v1/map/incidents", headers=headers)
        assert json_resp.status_code == 200
        incidents = json_resp.json()
        assert isinstance(incidents, list)
        assert len(incidents) >= 1
        assert "incident_type" in incidents[0]

        # 2. Fetch Incidents as GeoJSON FeatureCollection
        geojson_resp = await ac.get("/api/v1/map/incidents?format=geojson", headers=headers)
        assert geojson_resp.status_code == 200
        fc = geojson_resp.json()
        assert fc["type"] == "FeatureCollection"
        assert len(fc["features"]) >= 1
        assert fc["features"][0]["geometry"]["type"] == "Point"
        assert len(fc["features"][0]["geometry"]["coordinates"]) == 2

@pytest.mark.asyncio
async def test_map_bbox_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Bbox covering Sonapur / Meghalaya sector (lon: 92.0 to 92.5, lat: 25.0 to 25.5)
        bbox_resp = await ac.get("/api/v1/map/incidents?bbox=92.0,25.0,92.5,25.5", headers=headers)
        assert bbox_resp.status_code == 200
        items = bbox_resp.json()
        assert len(items) >= 1
        for inc in items:
            assert 25.0 <= inc["latitude"] <= 25.5
            assert 92.0 <= inc["longitude"] <= 92.5

@pytest.mark.asyncio
async def test_nearby_spatial_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Query nearby entities within 40 km of Sonapur
        nearby_resp = await ac.get("/api/v1/map/nearby?lat=25.105&lng=92.365&radius_km=40.0", headers=headers)
        assert nearby_resp.status_code == 200
        data = nearby_resp.json()
        assert "incidents" in data
        assert "infrastructure" in data
        assert "bridges" in data
        assert data["radius_km"] == 40.0
        assert len(data["incidents"]) >= 1
        assert data["incidents"][0]["distance_km"] <= 40.0

@pytest.mark.asyncio
async def test_map_search_service():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # 1. Search Guwahati
        search_resp = await ac.get("/api/v1/map/search?q=Guwahati", headers=headers)
        assert search_resp.status_code == 200
        results = search_resp.json()
        assert len(results) >= 1
        assert any("Guwahati" in r["name"] for r in results)

        # 2. Search Hospital
        hosp_resp = await ac.get("/api/v1/map/search?q=Hospital", headers=headers)
        assert hosp_resp.status_code == 200
        hosp_results = hosp_resp.json()
        assert len(hosp_results) >= 1
        assert any(r["type"] == "INFRASTRUCTURE" for r in hosp_results)

@pytest.mark.asyncio
async def test_road_and_district_matching():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        match_resp = await ac.get("/api/v1/map/road-match?lat=25.570&lng=91.880", headers=headers)
        assert match_resp.status_code == 200
        match_data = match_resp.json()
        assert "NH-6" in match_data["matched_road_name"]
        assert match_data["distance_to_road_km"] < 10.0
        assert match_data["district_name"] is not None

@pytest.mark.asyncio
async def test_government_fleet_layer_rbac_and_audit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Field Officer access
        o_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "officer.tawang@nermargdarshak.gov.in",
            "password": "Officer@Tawang2026"
        })
        o_headers = {"Authorization": f"Bearer {o_login.json()['access_token']}"}

        v_resp = await ac.get("/api/v1/map/vehicles", headers=o_headers)
        assert v_resp.status_code == 200
        vehicles = v_resp.json()
        assert isinstance(vehicles, list)

        # 2. Citizen access denied
        c_login = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "citizen.gangtok@nermargdarshak.in",
            "password": "Citizen@Pass123"
        })
        c_headers = {"Authorization": f"Bearer {c_login.json()['access_token']}"}

        c_resp = await ac.get("/api/v1/map/vehicles", headers=c_headers)
        assert c_resp.status_code == 403

@pytest.mark.asyncio
async def test_infrastructure_emergency_facilities():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/login", json={
            "email_or_phone": "driver.biren@nermargdarshak.in",
            "password": "Driver@Pass123"
        })
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        infra_resp = await ac.get("/api/v1/map/infrastructure", headers=headers)
        assert infra_resp.status_code == 200
        infra = infra_resp.json()
        assert len(infra) >= 5
        types = [item["type"] for item in infra]
        assert "HOSPITAL" in types
        assert "RELIEF_CENTER" in types
        assert "WAREHOUSE" in types
        assert "FUEL_STATION" in types

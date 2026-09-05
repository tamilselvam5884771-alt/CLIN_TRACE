def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    # In Phase 5+, GET / serves the SPA frontend HTML
    assert "CLINTRACE" in response.text or "html" in response.text

def test_health_check_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["service"] == "ClinTrace Backend API"
    assert "timestamp" in data

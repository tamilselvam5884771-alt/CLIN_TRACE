from backend.services.auth_service import seed_demo_users

def test_login_success(client, db_session):
    # Ensure demo users are seeded
    seed_demo_users(db_session)

    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "nurse@clintrace.demo", "password": "demo123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "nurse@clintrace.demo"
    assert data["user"]["role"] == "nurse"

def test_login_invalid_password(client, db_session):
    seed_demo_users(db_session)

    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "nurse@clintrace.demo", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

def test_get_current_user_me(client, db_session):
    seed_demo_users(db_session)

    # 1. Login
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "doctor@clintrace.demo", "password": "demo123"}
    )
    token = login_res.json()["token"]

    # 2. Get /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == "doctor@clintrace.demo"
    assert user_data["role"] == "doctor"

def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert "Successfully logged out" in response.json()["message"]

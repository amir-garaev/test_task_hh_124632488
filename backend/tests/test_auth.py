import pytest

@pytest.mark.anyio
async def test_register_and_login(client):
    r = await client.post("/auth/register", json={"email": "testtesttest@b.c", "password": "123456"})
    assert r.status_code in (200, 201), r.text
    token1 = r.json()["access_token"]
    assert token1

    r = await client.post("/auth/login", json={"email": "testtesttest@b.c", "password": "123456"})
    assert r.status_code == 200, r.text
    token2 = r.json()["access_token"]
    assert token2

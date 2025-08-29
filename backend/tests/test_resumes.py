import pytest

PER_PAGE = 10

@pytest.mark.anyio
async def test_resume_crud_and_history_flow(client):
    r = await client.get(f"/resume?page=1&per_page={PER_PAGE}")
    assert r.status_code == 200
    data = r.json()
    assert data["meta"]["total"] == 0

    r = await client.post("/resume", json={"title": "Junior Python", "content": "My content"})
    assert r.status_code in (200, 201), r.text
    resume = r.json()
    resume_id = resume["id"]
    assert resume["title"] == "Junior Python"

    r = await client.get(f"/resume?page=1&per_page={PER_PAGE}&q=python")
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(x["id"] == resume_id for x in items)

    r = await client.post(f"/resume/{resume_id}/improve")
    assert r.status_code == 200
    improved = r.json()
    assert "[Improved]" in improved["content"]

    r = await client.get(f"/resume/{resume_id}/history?page=1&per_page=5")
    assert r.status_code == 200
    hist = r.json()
    assert hist["meta"]["total"] >= 1
    assert len(hist["items"]) >= 1
    assert "version" in hist["items"][0]

    r = await client.patch(f"/resume/{resume_id}", json={"title": "Middle Python", "content": "New text"})
    assert r.status_code == 200
    updated = r.json()
    assert updated["title"] == "Middle Python"

    r = await client.get(f"/resume/{resume_id}/history?page=1&per_page=5")
    assert r.status_code == 200
    hist2 = r.json()
    assert hist2["meta"]["total"] >= hist["meta"]["total"]

    r = await client.delete(f"/resume/{resume_id}")
    assert r.status_code == 200
    assert r.json()["ok"] is True

    r = await client.get(f"/resume/{resume_id}")
    assert r.status_code == 404

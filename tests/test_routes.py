"""End-to-end smoke tests for the HTTP layer."""
from __future__ import annotations

import pytest

from commandcrafter import Config, create_app
from commandcrafter.builders import REGISTRY


@pytest.fixture()
def client():
    cfg = Config(
        gemini_api_key="",
        gemini_model="gemini-2.0-flash",
        host="127.0.0.1",
        port=7256,
        debug=False,
        analyze_cooldown_seconds=10,
    )
    app = create_app(cfg)
    app.testing = True
    return app.test_client()


def test_healthz(client):
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.data == b"ok"


def test_index(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Linux Command" in resp.data


@pytest.mark.parametrize(
    "name", ["builders", "analyze", "ssh", "aliases", "tutorials", "history", "favorites"]
)
def test_views(client, name):
    resp = client.get(f"/view/{name}")
    assert resp.status_code == 200


def test_unknown_view_404(client):
    resp = client.get("/view/nope")
    assert resp.status_code == 404


def test_builder_form_renders(client):
    resp = client.get("/builder/grep")
    assert resp.status_code == 200
    assert b"Pattern" in resp.data


def test_unknown_builder_404(client):
    resp = client.get("/builder/zzz")
    assert resp.status_code == 404


@pytest.mark.parametrize("builder_id", sorted(REGISTRY.keys()))
def test_post_build_each_builder(client, builder_id):
    resp = client.post(f"/build/{builder_id}", data={})
    assert resp.status_code == 200, builder_id


def test_analyze_disabled_when_no_key(client):
    resp = client.post("/api/analyze", json={"command": "ls -la"})
    assert resp.status_code == 503
    assert b"GEMINI_API_KEY" in resp.data


def test_analyze_validates_payload(client):
    # Even when disabled the route should not crash on missing JSON.
    resp = client.post("/api/analyze", data="not-json", headers={"Content-Type": "text/plain"})
    assert resp.status_code in {400, 503}

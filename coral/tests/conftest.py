import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from visyn_core.security.manager import SecurityManager
from visyn_core.security.model import User
from visyn_core.server.visyn_server import create_visyn_server
from visyn_core.tests.fixtures.postgres_db import postgres_db

assert postgres_db  # silence unused import warning


@pytest.fixture(scope="session")
def app(postgres_db) -> FastAPI:
    server = create_visyn_server(
        workspace_config={
            "tdp_core": {"enabled_plugins": ["tdp_core", "coral"]},
            "coral": {
                "dburl": postgres_db.url,
            },
        }
    )

    return server


@pytest.fixture()
def client(monkeypatch, app: FastAPI):
    def mock_current_user_in_manager(self):
        return User(id="admin")

    monkeypatch.setattr(SecurityManager, "current_user", property(mock_current_user_in_manager))

    with TestClient(app) as client:
        yield client

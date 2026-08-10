"""
Shared fixtures for API-level integration tests.

These talk HTTP to a running PUMP server backed by a real Postgres. They do
NOT drive a browser, so they are fast and deterministic enough to gate every
push in CI.

Environment:
    PUMP_API_URL  - base URL of the API (default http://localhost:5000)

Every test creates its own throwaway users via /api/auth/register, so there
are no shared fixtures to keep in sync and no credentials to store.
"""

import os
import time
import uuid

import pytest
import requests

API_URL = os.environ.get("PUMP_API_URL", "http://localhost:5000").rstrip("/")

# Registration and login sit behind a 5-request / 15-minute limiter. CI sets
# DISABLE_RATE_LIMIT=true so a suite that creates several users can run.
TIMEOUT = 30


def wait_for_server(url: str, attempts: int = 60, delay: float = 1.0) -> None:
    """Block until the API answers, so tests do not race the server start."""
    last_error = None
    for _ in range(attempts):
        try:
            response = requests.get(f"{url}/", timeout=5)
            if response.status_code == 200:
                return
        except requests.RequestException as exc:  # not up yet
            last_error = exc
        time.sleep(delay)
    raise RuntimeError(f"API at {url} did not become ready: {last_error}")


@pytest.fixture(scope="session", autouse=True)
def _server_ready():
    wait_for_server(API_URL)


class ApiUser:
    """A registered user with a token and helpers for authenticated calls."""

    def __init__(self, email: str, password: str, token: str, user_id: str):
        self.email = email
        self.password = password
        self.token = token
        self.id = user_id

    @property
    def headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, path: str, **kwargs):
        return requests.get(f"{API_URL}{path}", headers=self.headers, timeout=TIMEOUT, **kwargs)

    def post(self, path: str, json=None, **kwargs):
        return requests.post(
            f"{API_URL}{path}", headers=self.headers, json=json, timeout=TIMEOUT, **kwargs
        )

    def patch(self, path: str, json=None, **kwargs):
        return requests.patch(
            f"{API_URL}{path}", headers=self.headers, json=json, timeout=TIMEOUT, **kwargs
        )

    def delete(self, path: str, **kwargs):
        return requests.delete(
            f"{API_URL}{path}", headers=self.headers, timeout=TIMEOUT, **kwargs
        )


def create_user() -> ApiUser:
    """Register a fresh user and log in. Fails loudly on any bad status."""
    email = f"apitest-{uuid.uuid4().hex[:12]}@example.test"
    password = "IntegrationTest123!"

    registration = requests.post(
        f"{API_URL}/api/auth/register",
        json={"firstName": "Api", "lastName": "Test", "email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert registration.status_code == 201, (
        f"register failed: {registration.status_code} {registration.text}"
    )

    login = requests.post(
        f"{API_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert login.status_code == 200, f"login failed: {login.status_code} {login.text}"

    body = login.json()
    return ApiUser(email, password, body["token"], body["user"]["id"])


@pytest.fixture
def user() -> ApiUser:
    return create_user()


@pytest.fixture
def any_exercise(user: ApiUser) -> dict:
    """An arbitrary Exercise from the seeded library."""
    response = user.get("/api/exercises")
    assert response.status_code == 200, f"list exercises: {response.status_code} {response.text}"

    exercises = response.json()
    assert exercises, "exercise library is empty - was seed.sql loaded?"
    return exercises[0]


@pytest.fixture
def program_day(user: ApiUser, any_exercise: dict) -> dict:
    """
    A program with one day holding one exercise.

    Returns {'program', 'day', 'day_exercise', 'exercise'} — the shape the
    real client works with when starting a workout.
    """
    created = user.post("/api/programs", json={"name": "API Test Program", "splitType": "PPL"})
    assert created.status_code == 201, f"create program: {created.status_code} {created.text}"
    program = created.json()

    day = program["days"][0]

    added = user.post(
        f"/api/days/{day['id']}/exercises",
        json={"exerciseId": any_exercise["id"], "targetSets": 3, "targetReps": 10},
    )
    assert added.status_code == 201, f"add exercise to day: {added.status_code} {added.text}"

    return {
        "program": program,
        "day": day,
        "day_exercise": added.json(),
        "exercise": any_exercise,
    }

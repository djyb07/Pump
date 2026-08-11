"""
Cross-user authorization suite (Phase 3).

Two users are created per test. User A (the attacker) attempts to read and
modify every user-scoped resource belonging to user B (the victim). Every
attempt must fail, and B's data must be byte-for-byte unchanged afterwards.

WHY THIS SUITE EXISTS
The Supabase RLS policies in prisma/migrations/rls_enable_policies.sql are
inert: `relforcerowsecurity` is false on all eight tables and DATABASE_URL
connects as the table owner, so Postgres skips every policy. Verified against
production. That leaves the Express controllers as the ONLY layer isolating
one user's data from another's, with no database backstop. A single missing
`where: { userId }` in a future change is a cross-tenant breach, and this
suite is what stands between that mistake and production.

STANDARD
It is not enough to assert a status code. For every destructive attempt the
suite re-reads the resource AS THE VICTIM and proves it still exists and is
unchanged — the same standard applied to the M2 IDOR proof.

Status codes: four workout endpoints answer a cross-user attempt with 500
rather than 403/404, because their services throw a plain Error that reaches
the global handler (finding H4, not yet fixed). They fail CLOSED, so the
security property holds. `test_denials_use_a_proper_status_code` documents
the gap as an expected failure; it will start passing when H4 is fixed.
"""

import pytest

from conftest import create_user


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def attacker():
    return create_user()


@pytest.fixture
def victim():
    return create_user()


@pytest.fixture
def victim_data(victim):
    """
    A complete set of user-scoped resources owned by the victim:
    program -> day -> day-exercise, one finished workout with a logged set,
    and one in-progress workout.
    """
    exercise = victim.get("/api/exercises").json()[0]

    program = victim.post(
        "/api/programs", json={"name": "Victim Program", "splitType": "PPL"}
    ).json()
    day = program["days"][0]

    day_exercise = victim.post(
        f"/api/days/{day['id']}/exercises",
        json={"exerciseId": exercise["id"], "targetSets": 3, "targetReps": 10},
    ).json()

    # A finished workout with one logged set.
    finished = victim.post("/api/workouts/start", json={"dayId": day["id"]}).json()
    logged = victim.post(
        f"/api/workouts/{finished['id']}/sets",
        json={"dayExerciseId": day_exercise["id"], "reps": 10, "weight": 100},
    )
    assert logged.status_code == 201, f"fixture setup: {logged.status_code} {logged.text}"
    exercise_log = logged.json()
    victim.patch(
        f"/api/workouts/{finished['id']}/finish",
        json={"localEndTime": "2026-01-01T12:00:00.000Z"},
    )

    # A second, still in-progress workout.
    second_day = program["days"][1]
    in_progress = victim.post("/api/workouts/start", json={"dayId": second_day["id"]}).json()

    return {
        "exercise": exercise,
        "program": program,
        "day": day,
        "second_day": second_day,
        "day_exercise": day_exercise,
        "finished_workout": finished,
        "in_progress_workout": in_progress,
        "exercise_log": exercise_log,
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def assert_denied(response, what: str):
    """The attempt must not succeed. 4xx is correct; 5xx still fails closed."""
    assert response.status_code >= 400, (
        f"CROSS-USER ACCESS SUCCEEDED: {what} returned "
        f"{response.status_code} {response.text[:300]}"
    )


def victim_program_snapshot(victim, program_id):
    response = victim.get(f"/api/programs/{program_id}")
    assert response.status_code == 200, "victim lost access to their own program"
    return response.json()


def victim_workout_snapshot(victim, workout_id):
    response = victim.get(f"/api/workouts/{workout_id}")
    assert response.status_code == 200, "victim lost access to their own workout"
    return response.json()


# ─── Programs ────────────────────────────────────────────────────────────────

def test_cannot_read_another_users_program(attacker, victim, victim_data):
    program_id = victim_data["program"]["id"]

    response = attacker.get(f"/api/programs/{program_id}")
    assert_denied(response, "GET /api/programs/:id")
    assert victim_data["program"]["name"] not in response.text


def test_program_list_is_isolated(attacker, victim, victim_data):
    response = attacker.get("/api/programs")
    assert response.status_code == 200

    ids = [p["id"] for p in response.json()]
    assert victim_data["program"]["id"] not in ids, "victim's program leaked into A's list"
    assert all(p["userId"] == attacker.id for p in response.json())


def test_cannot_modify_another_users_program(attacker, victim, victim_data):
    program_id = victim_data["program"]["id"]

    response = attacker.patch(f"/api/programs/{program_id}", json={"name": "PWNED"})
    assert_denied(response, "PATCH /api/programs/:id")

    after = victim_program_snapshot(victim, program_id)
    assert after["name"] == "Victim Program", "victim's program was renamed"


def test_cannot_delete_another_users_program(attacker, victim, victim_data):
    program_id = victim_data["program"]["id"]

    response = attacker.delete(f"/api/programs/{program_id}")
    assert_denied(response, "DELETE /api/programs/:id")

    # Prove it still exists, read as the victim.
    after = victim_program_snapshot(victim, program_id)
    assert after["id"] == program_id, "victim's program was deleted"
    assert len(after["days"]) == len(victim_data["program"]["days"])


# ─── Days ────────────────────────────────────────────────────────────────────

def test_cannot_add_a_day_to_another_users_program(attacker, victim, victim_data):
    program_id = victim_data["program"]["id"]
    before = len(victim_program_snapshot(victim, program_id)["days"])

    response = attacker.post(f"/api/programs/{program_id}/days", json={"name": "Injected Day"})
    assert_denied(response, "POST /api/programs/:programId/days")

    after = victim_program_snapshot(victim, program_id)
    assert len(after["days"]) == before, "a day was injected into the victim's program"
    assert "Injected Day" not in [d["name"] for d in after["days"]]


def test_cannot_modify_another_users_day(attacker, victim, victim_data):
    response = attacker.patch(f"/api/days/{victim_data['day']['id']}", json={"name": "PWNED"})
    assert_denied(response, "PATCH /api/days/:id")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    names = [d["name"] for d in after["days"]]
    assert "PWNED" not in names, "victim's day was renamed"


def test_cannot_delete_another_users_day(attacker, victim, victim_data):
    day_id = victim_data["day"]["id"]

    response = attacker.delete(f"/api/days/{day_id}")
    assert_denied(response, "DELETE /api/days/:id")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    assert day_id in [d["id"] for d in after["days"]], "victim's day was deleted"


# ─── Day exercises ───────────────────────────────────────────────────────────

def test_cannot_add_an_exercise_to_another_users_day(attacker, victim, victim_data):
    day_id = victim_data["day"]["id"]
    exercise_id = victim_data["exercise"]["id"]

    response = attacker.post(
        f"/api/days/{day_id}/exercises", json={"exerciseId": exercise_id}
    )
    assert_denied(response, "POST /api/days/:dayId/exercises")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    day = next(d for d in after["days"] if d["id"] == day_id)
    assert len(day["exercises"]) == 1, "an exercise was injected into the victim's day"


def test_cannot_modify_another_users_day_exercise(attacker, victim, victim_data):
    day_exercise_id = victim_data["day_exercise"]["id"]

    response = attacker.patch(
        f"/api/day-exercises/{day_exercise_id}", json={"targetSets": 99}
    )
    assert_denied(response, "PATCH /api/day-exercises/:id")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    day = next(d for d in after["days"] if d["id"] == victim_data["day"]["id"])
    assert day["exercises"][0]["targetSets"] == 3, "victim's targets were changed"


def test_cannot_delete_another_users_day_exercise(attacker, victim, victim_data):
    day_exercise_id = victim_data["day_exercise"]["id"]

    response = attacker.delete(f"/api/day-exercises/{day_exercise_id}")
    assert_denied(response, "DELETE /api/day-exercises/:id")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    day = next(d for d in after["days"] if d["id"] == victim_data["day"]["id"])
    assert [e["id"] for e in day["exercises"]] == [day_exercise_id], (
        "victim's day exercise was deleted"
    )


# ─── Workouts ────────────────────────────────────────────────────────────────

def test_cannot_start_a_workout_on_another_users_day(attacker, victim, victim_data):
    response = attacker.post("/api/workouts/start", json={"dayId": victim_data["day"]["id"]})
    assert_denied(response, "POST /api/workouts/start with another user's dayId")

    # And no workout may have been created for the attacker.
    history = attacker.get("/api/workouts").json()
    assert history == [], "a workout was created against the victim's day"


def test_cannot_read_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["finished_workout"]["id"]

    response = attacker.get(f"/api/workouts/{workout_id}")
    assert_denied(response, "GET /api/workouts/:id")
    assert victim_data["exercise"]["nameEn"] not in response.text


def test_workout_history_is_isolated(attacker, victim, victim_data):
    response = attacker.get("/api/workouts")
    assert response.status_code == 200
    assert response.json() == [], "victim's workouts leaked into A's history"


def test_active_workout_is_isolated(attacker, victim, victim_data):
    """The victim has an in-progress workout; the attacker must not see it."""
    response = attacker.get("/api/workouts/active")
    assert response.status_code == 404, (
        f"attacker was handed an active workout: {response.status_code} {response.text[:300]}"
    )


def test_cannot_log_a_set_into_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["in_progress_workout"]["id"]

    response = attacker.post(
        f"/api/workouts/{workout_id}/sets",
        json={"dayExerciseId": victim_data["day_exercise"]["id"], "reps": 99, "weight": 999},
    )
    assert_denied(response, "POST /api/workouts/:id/sets")

    after = victim_workout_snapshot(victim, workout_id)
    assert after["exerciseLogs"] == [], "a set was injected into the victim's workout"


def test_cannot_attach_another_users_day_exercise_to_own_workout(attacker, victim, victim_data):
    """
    The M2 IDOR. The attacker logs into their OWN workout but references the
    victim's DayExercise. Against pre-M2 code this returned 200 and wrote a
    cross-tenant foreign key.
    """
    own_program = attacker.post(
        "/api/programs", json={"name": "Attacker Program", "splitType": "FULL_BODY"}
    ).json()
    own_workout = attacker.post(
        "/api/workouts/start", json={"dayId": own_program["days"][0]["id"]}
    ).json()

    response = attacker.post(
        f"/api/workouts/{own_workout['id']}/sets",
        json={"dayExerciseId": victim_data["day_exercise"]["id"], "reps": 10, "weight": 100},
    )
    assert_denied(response, "POST /api/workouts/:id/sets with another user's dayExerciseId")

    logs = attacker.get(f"/api/workouts/{own_workout['id']}").json()["exerciseLogs"]
    assert logs == [], "a cross-tenant foreign key was written"


def test_cannot_modify_a_set_in_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["finished_workout"]["id"]
    log_id = victim_data["exercise_log"]["id"]

    response = attacker.patch(
        f"/api/workouts/{workout_id}/sets/{log_id}/0", json={"reps": 1, "weight": 1}
    )
    assert_denied(response, "PATCH /api/workouts/:id/sets/:logId/:index")

    after = victim_workout_snapshot(victim, workout_id)
    sets = after["exerciseLogs"][0]["sets"]
    assert sets[0]["reps"] == 10 and sets[0]["weight"] == 100, "victim's set was altered"


def test_cannot_delete_a_set_from_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["finished_workout"]["id"]
    log_id = victim_data["exercise_log"]["id"]

    response = attacker.delete(f"/api/workouts/{workout_id}/sets/{log_id}/0")
    assert_denied(response, "DELETE /api/workouts/:id/sets/:logId/:index")

    after = victim_workout_snapshot(victim, workout_id)
    assert len(after["exerciseLogs"][0]["sets"]) == 1, "victim's set was deleted"


def test_cannot_finish_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["in_progress_workout"]["id"]

    response = attacker.patch(
        f"/api/workouts/{workout_id}/finish",
        json={"localEndTime": "2026-01-01T12:00:00.000Z"},
    )
    assert_denied(response, "PATCH /api/workouts/:id/finish")

    after = victim_workout_snapshot(victim, workout_id)
    assert after["status"] == "in_progress", "victim's workout was finished by another user"


def test_cannot_delete_another_users_workout(attacker, victim, victim_data):
    workout_id = victim_data["finished_workout"]["id"]

    response = attacker.delete(f"/api/workouts/{workout_id}")
    assert_denied(response, "DELETE /api/workouts/:id")

    after = victim_workout_snapshot(victim, workout_id)
    assert after["id"] == workout_id, "victim's workout was deleted"


# ─── Analytics ───────────────────────────────────────────────────────────────

def test_exercise_progress_is_isolated(attacker, victim, victim_data):
    """
    The exercise id is shared reference data, so the attacker may legitimately
    query it — but must see none of the victim's logged sets.
    """
    response = attacker.get(f"/api/analytics/progress/{victim_data['exercise']['id']}")
    assert response.status_code == 200

    assert response.json()["progress"] == [], "victim's training data leaked via progress"


def test_personal_records_are_isolated(attacker, victim, victim_data):
    response = attacker.get("/api/analytics/personal-records")
    assert response.status_code == 200
    assert response.json() == [], "victim's PRs leaked"


def test_muscle_recovery_is_isolated(attacker, victim, victim_data):
    response = attacker.get("/api/analytics/muscle-recovery")
    assert response.status_code == 200

    muscles = response.json()["muscles"]
    assert all(m["totalSets"] == 0 for m in muscles.values()), (
        "victim's training volume leaked into A's heatmap"
    )


def test_recalculate_prs_only_touches_own_data(attacker, victim, victim_data):
    before = victim.get("/api/analytics/personal-records").json()

    response = attacker.post("/api/migrations/recalculate-prs")
    assert response.status_code == 200
    assert response.json()["workoutsProcessed"] == 0, "attacker processed the victim's workouts"

    after = victim.get("/api/analytics/personal-records").json()
    assert after == before, "victim's PRs were altered by another user's migration run"


# ─── Identity ────────────────────────────────────────────────────────────────

def test_me_returns_only_the_caller(attacker, victim):
    response = attacker.get("/api/auth/me")
    assert response.status_code == 200

    body = response.json()["user"]
    assert body["id"] == attacker.id
    assert body["email"] == attacker.email
    assert body["email"] != victim.email


def test_profile_update_cannot_target_another_user(attacker, victim):
    """
    No endpoint accepts a client-supplied userId. Sending one must be ignored,
    not honoured.
    """
    response = attacker.put(
        "/api/auth/profile",
        json={"firstName": "Injected", "id": victim.id, "userId": victim.id},
    )
    assert response.status_code == 200

    assert response.json()["user"]["id"] == attacker.id, "profile update changed identity"

    victim_me = victim.get("/api/auth/me").json()["user"]
    assert victim_me["firstName"] != "Injected", "victim's profile was modified"


# ─── No token at all ─────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/programs"),
        ("GET", "/api/workouts"),
        ("GET", "/api/workouts/active"),
        ("GET", "/api/auth/me"),
        ("GET", "/api/exercises"),
        ("GET", "/api/analytics/personal-records"),
        ("GET", "/api/analytics/muscle-recovery"),
        ("POST", "/api/ai/analyze"),
        ("POST", "/api/migrations/recalculate-prs"),
    ],
)
def test_unauthenticated_access_is_rejected(method, path):
    import requests
    from conftest import API_URL, TIMEOUT

    response = requests.request(method, f"{API_URL}{path}", timeout=TIMEOUT)
    assert response.status_code == 401, (
        f"{method} {path} served an unauthenticated caller: {response.status_code}"
    )


# ─── Status-code quality (documents finding H4) ──────────────────────────────

def test_denials_use_a_proper_status_code(attacker, victim, victim_data):
    """
    Was an xfail while H4 was open: these four endpoints answered a cross-user
    attempt with 500 because their services threw plain Errors. Now asserted.

    404 rather than 403 throughout — a 403 confirms the id exists and belongs
    to someone, which is an existence oracle.
    """
    attempts = {
        "start workout on victim's day": attacker.post(
            "/api/workouts/start", json={"dayId": victim_data["day"]["id"]}
        ),
        "read victim's workout": attacker.get(
            f"/api/workouts/{victim_data['finished_workout']['id']}"
        ),
        "log set into victim's workout": attacker.post(
            f"/api/workouts/{victim_data['in_progress_workout']['id']}/sets",
            json={"dayExerciseId": victim_data["day_exercise"]["id"], "reps": 1},
        ),
        "finish victim's workout": attacker.patch(
            f"/api/workouts/{victim_data['in_progress_workout']['id']}/finish", json={}
        ),
    }

    server_errors = {
        name: response.status_code
        for name, response in attempts.items()
        if response.status_code >= 500
    }
    assert not server_errors, f"denials returned 5xx instead of 404: {server_errors}"

    wrong_code = {
        name: response.status_code
        for name, response in attempts.items()
        if response.status_code != 404
    }
    assert not wrong_code, f"cross-user denials must be 404, got: {wrong_code}"


def test_deleting_another_users_workout_is_404_not_403(attacker, victim, victim_data):
    """deleteWorkout answered 403, which is an existence oracle."""
    response = attacker.delete(f"/api/workouts/{victim_data['finished_workout']['id']}")
    assert response.status_code == 404, (
        f"expected 404, got {response.status_code} {response.text[:200]}"
    )


# ─── Ownership must be decided before state or shape (H4 / H2 follow-ups) ────

def test_finished_workout_state_is_not_leaked_by_409(attacker, victim, victim_data):
    """
    H4 introduced a 409 for "workout is not in progress". Ownership is checked
    BEFORE state, so another user's finished workout must still answer 404 —
    a 409 would confirm the id exists and reveal its status.
    """
    finished_id = victim_data["finished_workout"]["id"]

    logged = attacker.post(
        f"/api/workouts/{finished_id}/sets",
        json={"dayExerciseId": victim_data["day_exercise"]["id"], "reps": 5},
    )
    assert logged.status_code == 404, (
        f"log-set on another user's finished workout leaked its state: "
        f"{logged.status_code} {logged.text[:200]}"
    )

    finish = attacker.patch(f"/api/workouts/{finished_id}/finish", json={})
    assert finish.status_code == 404, (
        f"finish on another user's finished workout leaked its state: "
        f"{finish.status_code} {finish.text[:200]}"
    )


def test_cannot_clear_another_users_target_weight(attacker, victim, victim_data):
    """
    targetWeight became nullable in H2. The clearing path must be
    ownership-checked like any other write.
    """
    victim.patch(
        f"/api/day-exercises/{victim_data['day_exercise']['id']}",
        json={"targetWeight": 75},
    )

    response = attacker.patch(
        f"/api/day-exercises/{victim_data['day_exercise']['id']}",
        json={"targetWeight": None},
    )
    assert_denied(response, "PATCH /api/day-exercises/:id with targetWeight: null")

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    day = next(d for d in after["days"] if d["id"] == victim_data["day"]["id"])
    assert day["exercises"][0]["targetWeight"] == 75, "victim's target weight was cleared"


def test_invalid_body_on_another_users_resource_changes_nothing(attacker, victim, victim_data):
    """
    H2 put validation in front of these controllers, so a malformed cross-user
    request is now rejected on shape (400) rather than ownership (404). Either
    is a denial — what must never happen is a mutation.
    """
    attempts = [
        (attacker.patch(f"/api/programs/{victim_data['program']['id']}",
                        json={"splitType": "GARBAGE"}), "program splitType"),
        (attacker.patch(f"/api/days/{victim_data['day']['id']}",
                        json={"name": ""}), "day name"),
        (attacker.post(f"/api/programs/{victim_data['program']['id']}/days",
                       json={"name": "x" * 5000}), "oversized day name"),
        (attacker.patch(f"/api/day-exercises/{victim_data['day_exercise']['id']}",
                        json={"targetSets": -1}), "negative targetSets"),
    ]
    for response, what in attempts:
        assert response.status_code in (400, 404), (
            f"{what}: expected 400 or 404, got {response.status_code} {response.text[:200]}"
        )

    after = victim_program_snapshot(victim, victim_data["program"]["id"])
    assert after["name"] == "Victim Program"
    assert after["splitType"] == "PPL"
    assert len(after["days"]) == len(victim_data["program"]["days"])

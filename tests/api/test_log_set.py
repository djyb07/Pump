"""
Regression tests for POST /api/workouts/:id/sets  (findings M2 + the outage).

The outage: logSetSchema made `exerciseId` mandatory, but the client only ever
sent `dayExerciseId` (client/src/services/workoutService.ts:81). Every real
"Log Set" click was rejected with 400 for five months. test_client_payload_is_accepted
posts that exact body and FAILS against main.

M2: the DayExercise was looked up with a bare findUnique (no ownership
predicate), and on a miss the log was written with exerciseId '' and
exerciseName 'Unknown Exercise' — rows invisible to PR calculation, progress
charts and the muscle heatmap.
"""

from conftest import create_user


# ─── The outage ──────────────────────────────────────────────────────────────

def test_client_payload_is_accepted(user, program_day):
    """
    Posts the EXACT body the browser client sends, field for field:
        { dayExerciseId, reps, weight, completed, type, rpe }
    No exerciseId. Asserts 201 and that the set is readable afterwards.

    Fails against main with 400 "Exercise ID is required".
    """
    started = user.post("/api/workouts/start", json={"dayId": program_day["day"]["id"]})
    assert started.status_code == 200, f"start: {started.status_code} {started.text}"
    workout_id = started.json()["id"]

    # Exactly what client/src/services/workoutService.ts:81 sends.
    payload = {
        "dayExerciseId": program_day["day_exercise"]["id"],
        "reps": 10,
        "weight": 100,
        "completed": True,
        "type": "NORMAL",
        "rpe": 8,
    }

    logged = user.post(f"/api/workouts/{workout_id}/sets", json=payload)
    assert logged.status_code == 201, (
        f"the client's own payload was rejected: {logged.status_code} {logged.text}"
    )

    body = logged.json()

    # The record must be usable by statistics, not a placeholder.
    assert body["exerciseId"] == program_day["exercise"]["id"], (
        "exerciseId must be derived from the DayExercise, not left empty"
    )
    assert body["exerciseName"] == program_day["exercise"]["nameEn"]
    assert body["exerciseName"] != "Unknown Exercise"

    # And the set must actually be readable back.
    fetched = user.get(f"/api/workouts/{workout_id}")
    assert fetched.status_code == 200, f"read back: {fetched.status_code} {fetched.text}"

    logs = fetched.json()["exerciseLogs"]
    assert len(logs) == 1, f"expected exactly one exercise log, got {len(logs)}"

    sets = logs[0]["sets"]
    assert len(sets) == 1, f"expected exactly one set, got {sets}"
    assert sets[0]["reps"] == 10
    assert sets[0]["weight"] == 100
    assert sets[0]["type"] == "NORMAL"
    assert sets[0]["rpe"] == 8


def test_repeated_sets_accumulate_on_one_log(user, program_day):
    """Three sets on the same exercise land in one log, numbered 1..3."""
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    for index in range(3):
        response = user.post(
            f"/api/workouts/{workout_id}/sets",
            json={"dayExerciseId": program_day["day_exercise"]["id"], "reps": 8 + index, "weight": 60},
        )
        assert response.status_code == 201, f"set {index}: {response.status_code} {response.text}"

    logs = user.get(f"/api/workouts/{workout_id}").json()["exerciseLogs"]
    assert len(logs) == 1, "sets for one exercise must share a single log"
    assert [s["setNumber"] for s in logs[0]["sets"]] == [1, 2, 3]
    assert [s["reps"] for s in logs[0]["sets"]] == [8, 9, 10]


# ─── M2: ownership ───────────────────────────────────────────────────────────

def test_rejects_day_exercise_owned_by_another_user(user, program_day):
    """
    User B must not be able to attach user A's DayExercise to B's own workout.
    Against main this succeeded and wrote a cross-tenant foreign key.
    """
    attacker = create_user()

    # The attacker needs a workout of their own to log into.
    attacker_program = attacker.post(
        "/api/programs", json={"name": "Attacker Program", "splitType": "FULL_BODY"}
    ).json()
    attacker_day = attacker_program["days"][0]
    attacker_workout = attacker.post(
        "/api/workouts/start", json={"dayId": attacker_day["id"]}
    ).json()

    # ...but references the victim's DayExercise id.
    response = attacker.post(
        f"/api/workouts/{attacker_workout['id']}/sets",
        json={"dayExerciseId": program_day["day_exercise"]["id"], "reps": 10, "weight": 100},
    )

    assert response.status_code == 404, (
        f"expected 404 for another user's dayExerciseId, got "
        f"{response.status_code} {response.text}"
    )

    # Nothing may have been written.
    logs = attacker.get(f"/api/workouts/{attacker_workout['id']}").json()["exerciseLogs"]
    assert logs == [], f"rejected request still wrote a log: {logs}"


def test_rejects_unknown_day_exercise(user, program_day):
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    response = user.post(
        f"/api/workouts/{workout_id}/sets",
        json={"dayExerciseId": "00000000-0000-0000-0000-000000000000", "reps": 10},
    )
    assert response.status_code == 404, f"{response.status_code} {response.text}"


# ─── M2: the freestyle path ──────────────────────────────────────────────────

def test_freestyle_set_writes_a_real_record(user, program_day, any_exercise):
    """
    A set logged with exerciseId and no dayExerciseId must resolve a real
    Exercise. Against main this wrote exerciseId '' / 'Unknown Exercise'.
    """
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    response = user.post(
        f"/api/workouts/{workout_id}/sets",
        json={"exerciseId": any_exercise["id"], "reps": 12, "weight": 40},
    )
    assert response.status_code == 201, f"{response.status_code} {response.text}"

    body = response.json()
    assert body["exerciseId"] == any_exercise["id"]
    assert body["exerciseName"] == any_exercise["nameEn"]
    assert body["exerciseId"] != "", "freestyle set wrote a statistics-invisible record"
    assert body["exerciseName"] != "Unknown Exercise"


def test_freestyle_set_with_unknown_exercise_fails_loudly(user, program_day):
    """An unresolvable exerciseId must error, never write a placeholder row."""
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    response = user.post(
        f"/api/workouts/{workout_id}/sets",
        json={"exerciseId": "00000000-0000-0000-0000-000000000000", "reps": 10},
    )
    assert response.status_code == 404, f"{response.status_code} {response.text}"

    logs = user.get(f"/api/workouts/{workout_id}").json()["exerciseLogs"]
    assert logs == [], f"failed lookup still wrote a log: {logs}"


def test_freestyle_sets_for_different_exercises_do_not_merge(user, program_day):
    """
    Freestyle logs group by exerciseId, not by a null dayExerciseId — otherwise
    two different exercises would collapse into one log.
    """
    exercises = user.get("/api/exercises").json()
    assert len(exercises) >= 2, "need at least two seeded exercises"
    first, second = exercises[0], exercises[1]

    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    for exercise in (first, second):
        response = user.post(
            f"/api/workouts/{workout_id}/sets",
            json={"exerciseId": exercise["id"], "reps": 10, "weight": 50},
        )
        assert response.status_code == 201, f"{response.status_code} {response.text}"

    logs = user.get(f"/api/workouts/{workout_id}").json()["exerciseLogs"]
    assert len(logs) == 2, f"expected two separate logs, got {len(logs)}"
    assert {log["exerciseId"] for log in logs} == {first["id"], second["id"]}


def test_requires_one_of_day_exercise_or_exercise(user, program_day):
    """Neither identifier supplied is a 400, not a placeholder row."""
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    response = user.post(f"/api/workouts/{workout_id}/sets", json={"reps": 10})
    assert response.status_code == 400, f"{response.status_code} {response.text}"

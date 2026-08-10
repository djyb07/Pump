"""
End-to-end smoke test for the core workout loop.

start workout -> log sets -> finish workout -> read the sets back

This is the test that would have caught the five-month set-logging outage.
The Selenium test it replaces printed a warning when it could not log a set,
carried on, and reported TEST PASSED. Every step here asserts, and a failure
at any step fails the test immediately - there is no "continue anyway" path.
"""


def test_full_workout_loop_and_sets_are_readable(user, program_day):
    day_exercise_id = program_day["day_exercise"]["id"]
    exercise = program_day["exercise"]

    # ── 1. Start ─────────────────────────────────────────────────────────────
    started = user.post("/api/workouts/start", json={"dayId": program_day["day"]["id"]})
    assert started.status_code == 200, f"start workout: {started.status_code} {started.text}"

    workout = started.json()
    workout_id = workout["id"]
    assert workout["status"] == "in_progress", f"unexpected status: {workout['status']}"

    # The workout must be discoverable as the active one.
    active = user.get("/api/workouts/active")
    assert active.status_code == 200, f"active workout: {active.status_code} {active.text}"
    assert active.json()["id"] == workout_id

    # ── 2. Log sets ──────────────────────────────────────────────────────────
    planned = [
        {"reps": 12, "weight": 60.0, "type": "WARMUP"},
        {"reps": 10, "weight": 100.0, "type": "NORMAL", "rpe": 8},
        {"reps": 8, "weight": 100.0, "type": "NORMAL", "rpe": 9},
    ]

    for index, entry in enumerate(planned, start=1):
        response = user.post(
            f"/api/workouts/{workout_id}/sets",
            json={"dayExerciseId": day_exercise_id, **entry},
        )
        assert response.status_code == 201, (
            f"logging set {index} failed: {response.status_code} {response.text}"
        )

    # ── 3. Finish ────────────────────────────────────────────────────────────
    finished = user.patch(
        f"/api/workouts/{workout_id}/finish",
        json={"notes": "smoke test", "localEndTime": "2026-01-01T12:00:00.000Z"},
    )
    assert finished.status_code == 200, f"finish: {finished.status_code} {finished.text}"
    assert finished.json()["status"] == "completed"

    # No workout should be active any more.
    assert user.get("/api/workouts/active").status_code == 404

    # ── 4. The sets must be readable afterwards ──────────────────────────────
    fetched = user.get(f"/api/workouts/{workout_id}")
    assert fetched.status_code == 200, f"read back: {fetched.status_code} {fetched.text}"

    body = fetched.json()
    assert body["status"] == "completed"

    logs = body["exerciseLogs"]
    assert len(logs) == 1, f"expected one exercise log, got {len(logs)}"

    log = logs[0]
    assert log["exerciseId"] == exercise["id"], "log is not attributable to a real exercise"
    assert log["exerciseName"] == exercise["nameEn"]

    sets = log["sets"]
    assert len(sets) == 3, f"expected 3 sets, got {len(sets)}: {sets}"
    assert [s["setNumber"] for s in sets] == [1, 2, 3]
    assert [s["reps"] for s in sets] == [12, 10, 8]
    assert [s["type"] for s in sets] == ["WARMUP", "NORMAL", "NORMAL"]
    assert sets[1]["rpe"] == 8 and sets[2]["rpe"] == 9

    # ── 5. And in history ────────────────────────────────────────────────────
    history = user.get("/api/workouts")
    assert history.status_code == 200, f"history: {history.status_code} {history.text}"
    assert workout_id in [w["id"] for w in history.json()], "finished workout missing from history"


def test_finished_workout_feeds_statistics(user, program_day):
    """
    A completed workout must be visible to the analytics endpoints. This is
    what a placeholder exerciseId silently broke: the set was stored, but no
    statistic could ever see it.
    """
    exercise = program_day["exercise"]

    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    for entry in ({"reps": 12, "weight": 50.0, "type": "WARMUP"},
                  {"reps": 5, "weight": 120.0, "type": "NORMAL"}):
        response = user.post(
            f"/api/workouts/{workout_id}/sets",
            json={"dayExerciseId": program_day["day_exercise"]["id"], **entry},
        )
        assert response.status_code == 201, f"{response.status_code} {response.text}"

    finished = user.patch(
        f"/api/workouts/{workout_id}/finish",
        json={"localEndTime": "2026-01-01T12:00:00.000Z"},
    )
    assert finished.status_code == 200, f"finish: {finished.status_code} {finished.text}"

    progress = user.get(f"/api/analytics/progress/{exercise['id']}")
    assert progress.status_code == 200, f"progress: {progress.status_code} {progress.text}"

    points = progress.json()["progress"]
    assert len(points) == 1, f"completed workout did not reach progress data: {points}"

    # Warmups are excluded from working-set statistics.
    assert points[0]["maxWeight"] == 120.0
    assert points[0]["sets"] == 1, "warmup set should not count as a working set"

"""
Regression tests for the Item B drift mismatches 3, 4 and 5.

All three shared one root cause: the client sent `undefined` for a field it
meant to clear, `JSON.stringify` dropped the key, and the server treated the
absent key as "leave unchanged". The value could be set but never unset.

Each of these fails against the pre-fix code.
"""

import pytest


# ─── Mismatch 3: avatar must be removable ────────────────────────────────────
#
# HONEST SCOPE NOTE: mismatch 3 was a CLIENT-side bug. ProfilePage sent
# `avatarUrl: form.avatarUrl.trim() || undefined`, and JSON.stringify drops
# undefined, so the server never received the field. The server already
# handled an explicit null correctly.
#
# These tests therefore do NOT fail against the pre-fix code — an API-level
# test cannot reach a bug that lives in the browser. What they do is pin the
# two server behaviours the fixed client now depends on, so a future server
# change cannot silently take avatar removal away again. Proving the client
# itself sends null needs a browser-level or client-unit test; there is no
# JS test runner in this repo yet.

def test_avatar_null_clears_it(user):
    response = user.put("/api/auth/profile", json={"avatarUrl": "https://example.test/a.png"})
    assert response.status_code == 200, f"{response.status_code} {response.text}"
    assert response.json()["user"]["avatarUrl"] == "https://example.test/a.png"

    response = user.put(
        "/api/auth/profile",
        json={"firstName": "Api", "lastName": "Test", "avatarUrl": None},
    )
    assert response.status_code == 200, f"{response.status_code} {response.text}"
    assert not response.json()["user"]["avatarUrl"], "explicit null did not clear the avatar"

    me = user.get("/api/auth/me")
    assert me.status_code == 200
    assert not me.json()["user"]["avatarUrl"], "avatar came back after re-read"


def test_avatar_omitted_leaves_it_unchanged(user):
    """
    The other half of the contract, and the exact mechanism of the bug: an
    omitted key means "leave alone". The old client omitted the key when the
    field was empty, so clearing was indistinguishable from not touching it.
    """
    user.put("/api/auth/profile", json={"avatarUrl": "https://example.test/b.png"})

    response = user.put("/api/auth/profile", json={"firstName": "Renamed"})
    assert response.status_code == 200, f"{response.status_code} {response.text}"

    body = response.json()["user"]
    assert body["firstName"] == "Renamed"
    assert body["avatarUrl"] == "https://example.test/b.png", (
        "omitting avatarUrl must not change it"
    )


# ─── Mismatch 4: target weight clearable, targetSets accepts 0 ───────────────

def test_target_weight_can_be_set_then_cleared(user, program_day):
    day_exercise_id = program_day["day_exercise"]["id"]

    response = user.patch(f"/api/day-exercises/{day_exercise_id}", json={"targetWeight": 80})
    assert response.status_code == 200, f"{response.status_code} {response.text}"
    assert response.json()["targetWeight"] == 80

    response = user.patch(f"/api/day-exercises/{day_exercise_id}", json={"targetWeight": None})
    assert response.status_code == 200, f"{response.status_code} {response.text}"
    assert response.json()["targetWeight"] is None, (
        "target weight was not cleared — null was treated as 'unchanged'"
    )


@pytest.mark.parametrize("field", ["targetSets", "targetReps"])
def test_zero_is_a_real_value_not_a_missing_one(user, program_day, field):
    """A falsy guard used to discard 0 as if the field had not been sent."""
    day_exercise_id = program_day["day_exercise"]["id"]

    response = user.patch(f"/api/day-exercises/{day_exercise_id}", json={field: 0})
    assert response.status_code == 200, f"{response.status_code} {response.text}"
    assert response.json()[field] == 0, f"{field}=0 was silently discarded"


# ─── Mismatch 5: weight-only set edits ───────────────────────────────────────

def _workout_with_one_set(user, program_day):
    workout_id = user.post(
        "/api/workouts/start", json={"dayId": program_day["day"]["id"]}
    ).json()["id"]

    logged = user.post(
        f"/api/workouts/{workout_id}/sets",
        json={"dayExerciseId": program_day["day_exercise"]["id"],
              "reps": 10, "weight": 100, "type": "NORMAL", "rpe": 7},
    )
    assert logged.status_code == 201, f"{logged.status_code} {logged.text}"
    return workout_id, logged.json()["id"]


def test_weight_only_edit_keeps_reps(user, program_day):
    """
    Sending only `weight` used to be impossible: the schema demanded `reps`,
    so the request 400'd. Reps must survive a weight-only edit.
    """
    workout_id, log_id = _workout_with_one_set(user, program_day)

    response = user.patch(
        f"/api/workouts/{workout_id}/sets/{log_id}/0", json={"weight": 110}
    )
    assert response.status_code == 200, f"weight-only edit rejected: {response.status_code} {response.text}"

    updated = response.json()["sets"][0]
    assert updated["weight"] == 110
    assert updated["reps"] == 10, "reps were clobbered by a weight-only edit"
    assert updated["rpe"] == 7, "rpe was clobbered by a weight-only edit"


def test_reps_only_edit_keeps_weight(user, program_day):
    workout_id, log_id = _workout_with_one_set(user, program_day)

    response = user.patch(f"/api/workouts/{workout_id}/sets/{log_id}/0", json={"reps": 8})
    assert response.status_code == 200, f"{response.status_code} {response.text}"

    updated = response.json()["sets"][0]
    assert updated["reps"] == 8
    assert updated["weight"] == 100, "weight was clobbered by a reps-only edit"


def test_null_weight_does_not_400(user, program_day):
    """A blank numeric input serialises to null; that must not be a 400."""
    workout_id, log_id = _workout_with_one_set(user, program_day)

    response = user.patch(
        f"/api/workouts/{workout_id}/sets/{log_id}/0", json={"reps": 9, "weight": None}
    )
    assert response.status_code == 200, f"null weight rejected: {response.status_code} {response.text}"
    assert response.json()["sets"][0]["reps"] == 9


def test_empty_set_patch_is_rejected(user, program_day):
    workout_id, log_id = _workout_with_one_set(user, program_day)

    response = user.patch(f"/api/workouts/{workout_id}/sets/{log_id}/0", json={})
    assert response.status_code == 400, f"{response.status_code} {response.text}"

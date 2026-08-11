"""
Regression tests for the H2 validation schemas.

Adding Zod to the six program/day/day-exercise endpoints created three chances
to require a field the client never sends — the exact mistake that killed set
logging for five months. Each test below posts the EXACT payload the client
sends today and asserts it is accepted, so the breakage cannot be
reintroduced by a later "tightening" of a schema.

  A. POST /programs/:programId/days      client sends { name } only, no dayType
  B. PATCH /day-exercises/:id            client sends targetWeight: null to clear
  C. POST /days/:dayId/exercises         client omits targetWeight and notes

Verified to fail against a naive schema that requires dayType, and that makes
targetWeight non-nullable / the optional fields required.
"""

import pytest

from conftest import create_user


# ─── A: the client posts only a name when adding a day ───────────────────────

def test_add_day_accepts_the_clients_name_only_payload(user):
    """
    ProgramDetailsPage.handleAddDay -> programService.addDay(id, { name }).
    AddDayModal collects a name and nothing else: no dayType is ever sent.
    """
    program = user.post(
        "/api/programs", json={"name": "Validation Program", "splitType": "CUSTOM"}
    ).json()

    # Exactly what the client sends.
    response = user.post(f"/api/programs/{program['id']}/days", json={"name": "Push Day"})

    assert response.status_code == 201, (
        f"the client's own add-day payload was rejected: "
        f"{response.status_code} {response.text}"
    )

    body = response.json()
    assert body["name"] == "Push Day"
    assert body["programId"] == program["id"]

    # And it must be readable back.
    days = user.get(f"/api/programs/{program['id']}").json()["days"]
    assert "Push Day" in [d["name"] for d in days]


# ─── B: the client clears the target weight with an explicit null ────────────

def test_update_day_exercise_accepts_the_clients_null_weight_payload(user, program_day):
    """
    EditExerciseModal.handleSubmit sends
        { targetSets, targetReps, targetWeight: weight > 0 ? weight : null }
    so targetWeight must be nullable, not merely optional.
    """
    day_exercise_id = program_day["day_exercise"]["id"]

    # Set a weight first, so clearing it is observable.
    seeded = user.patch(
        f"/api/day-exercises/{day_exercise_id}",
        json={"targetSets": 4, "targetReps": 8, "targetWeight": 60},
    )
    assert seeded.status_code == 200, f"{seeded.status_code} {seeded.text}"
    assert seeded.json()["targetWeight"] == 60

    # Exactly what the client sends when the weight field is emptied.
    response = user.patch(
        f"/api/day-exercises/{day_exercise_id}",
        json={"targetSets": 4, "targetReps": 8, "targetWeight": None},
    )

    assert response.status_code == 200, (
        f"the client's own null-weight payload was rejected: "
        f"{response.status_code} {response.text}"
    )
    assert response.json()["targetWeight"] is None


# ─── C: the client omits targetWeight and notes when adding an exercise ──────

def test_add_day_exercise_accepts_the_clients_partial_payload(user, any_exercise):
    """
    ProgramDetailsPage.handleSelectExercise sends
        { exerciseId, targetSets: 3, targetReps: 10 }
    with no targetWeight and no notes.
    """
    program = user.post(
        "/api/programs", json={"name": "Validation Program", "splitType": "PPL"}
    ).json()
    day_id = program["days"][0]["id"]

    # Exactly what the client sends.
    response = user.post(
        f"/api/days/{day_id}/exercises",
        json={"exerciseId": any_exercise["id"], "targetSets": 3, "targetReps": 10},
    )

    assert response.status_code == 201, (
        f"the client's own add-exercise payload was rejected: "
        f"{response.status_code} {response.text}"
    )

    body = response.json()
    assert body["exerciseId"] == any_exercise["id"]
    assert body["targetSets"] == 3
    assert body["targetReps"] == 10


# ─── The create-program payload, for completeness ────────────────────────────

def test_create_program_accepts_the_clients_payload(user):
    """CreateProgramPage sends { name, splitType } with a trimmed name."""
    response = user.post(
        "/api/programs", json={"name": "My PPL Program", "splitType": "PPL"}
    )
    assert response.status_code == 201, f"{response.status_code} {response.text}"
    assert len(response.json()["days"]) == 3, "PPL should generate three days"


@pytest.mark.parametrize(
    "split_type", ["PPL", "UPPER_LOWER", "FULL_BODY", "PUSH_PULL", "FIVE_DAY", "CUSTOM"]
)
def test_every_split_type_the_ui_offers_is_accepted(user, split_type):
    """
    The six values CreateProgramPage can produce must all pass the enum.
    A mismatch here would make a split type unusable from the UI.
    """
    response = user.post("/api/programs", json={"name": "Split Test", "splitType": split_type})
    assert response.status_code == 201, (
        f"splitType {split_type} rejected: {response.status_code} {response.text}"
    )


# ─── What the new validation is actually for ─────────────────────────────────

def test_unknown_split_type_is_rejected_instead_of_creating_an_empty_program(user):
    """
    Previously accepted, silently producing a program with zero days - a dead
    end for the user with no error to explain it.
    """
    response = user.post("/api/programs", json={"name": "Bad Split", "splitType": "GARBAGE"})
    assert response.status_code == 400, f"{response.status_code} {response.text}"


def test_unbounded_program_name_is_rejected(user):
    response = user.post("/api/programs", json={"name": "x" * 5000, "splitType": "PPL"})
    assert response.status_code == 400, f"{response.status_code} {response.text}"


def test_validation_errors_carry_field_detail(user):
    """
    The client's getApiErrorMessage helper renders `errors[].field/message`.
    If the shape changes, the UI silently degrades to a generic string.
    """
    response = user.post("/api/programs", json={"splitType": "PPL"})
    assert response.status_code == 400

    body = response.json()
    assert body["message"] == "Validation failed"
    assert isinstance(body["errors"], list) and body["errors"]
    assert {"field", "message"} <= set(body["errors"][0].keys())


def test_empty_patch_body_is_rejected(user, program_day):
    response = user.patch(f"/api/day-exercises/{program_day['day_exercise']['id']}", json={})
    assert response.status_code == 400, f"{response.status_code} {response.text}"

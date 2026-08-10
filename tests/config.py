"""
Shared E2E test configuration.

Credentials are read from the environment with NO fallback default, and the
target host defaults to a local dev server. Nothing in this repository may
contain a working account password, and no test may point at production
unless the operator opts in explicitly by setting PUMP_BASE_URL.

Required environment variables:
    PUMP_TEST_EMAIL     - email of an existing account on the target host
    PUMP_TEST_PASSWORD  - its password

Optional:
    PUMP_BASE_URL       - target host (default: http://localhost:5173)
"""

import os

DEFAULT_BASE_URL = "http://localhost:5173"

# Never defaults to production. Set PUMP_BASE_URL to target anything else.
BASE_URL = os.environ.get("PUMP_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


class MissingCredentialsError(RuntimeError):
    """Raised when required credential environment variables are not set."""


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise MissingCredentialsError(
            f"{name} is not set.\n"
            f"E2E tests take credentials from the environment - there is no default.\n"
            f"  PUMP_TEST_EMAIL=you@example.com "
            f"PUMP_TEST_PASSWORD=... python run_all_tests.py\n"
            f"Target host defaults to {DEFAULT_BASE_URL}; "
            f"set PUMP_BASE_URL to point elsewhere."
        )
    return value


def require_credentials() -> dict:
    """
    Return {'email', 'password'} for an existing account on BASE_URL.

    Raises MissingCredentialsError if either variable is absent, so a
    misconfigured run fails loudly instead of silently using a default.
    """
    return {
        "email": _require("PUMP_TEST_EMAIL"),
        "password": _require("PUMP_TEST_PASSWORD"),
    }


def require_password() -> str:
    """Password to use when registering a brand-new throwaway account."""
    return _require("PUMP_TEST_PASSWORD")

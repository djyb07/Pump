"""
Test Runner: Execute All E2E Tests
"""
import sys
import importlib.util
from pathlib import Path

TEST_MODULES = ["test_register", "test_login", "test_create_program", "test_workout_flow", "test_view_progress"]

def load_and_run_test(test_name):
    try:
        test_path = Path(__file__).parent / f"{test_name}.py"
        spec = importlib.util.spec_from_file_location(test_name, test_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        test_func = getattr(module, test_name)
        return (test_name, test_func(), None)
    except Exception as e:
        return (test_name, False, str(e))

def main():
    print("=" * 60)
    print("PUMP E2E TEST SUITE - Running all 5 tests")
    print("=" * 60)
    results = [load_and_run_test(t) for t in TEST_MODULES]
    passed = sum(1 for _, s, _ in results if s)
    print(f"\nSUMMARY: {passed}/{len(results)} passed")
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()

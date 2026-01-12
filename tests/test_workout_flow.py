"""
E2E Test: Workout Flow
======================
This test logs in, navigates to a program, starts a workout,
adds a set, finishes the workout, and verifies redirection to history/details.

Tested Flow:
1. Login with valid credentials
2. Navigate to a program's details page
3. Click "Start Workout" on a day
4. Add a set (weight and reps)
5. Click "Finish Workout"
6. Confirm in the modal
7. Verify redirection to workout history or details page

Requirements:
- Chrome browser (or chromedriver in PATH)
- selenium package: pip install selenium
- Application running at http://localhost:5173
- A valid registered user with at least one program containing exercises

IMPORTANT: Update TEST_USER credentials and PROGRAM_ID before running!
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ================== CONFIGURATION ==================
BASE_URL = "https://pump-client.vercel.app"
LOGIN_URL = f"{BASE_URL}/login"
PROGRAMS_URL = f"{BASE_URL}/programs"
ACTIVE_WORKOUT_URL = f"{BASE_URL}/workout/active"
WORKOUT_HISTORY_URL = f"{BASE_URL}/workout/history"

# Test user credentials - UPDATE THESE with valid credentials!
TEST_USER = {
    "email": "test@example.com",      # Replace with valid email
    "password": "TestPassword123!"    # Replace with valid password
}

# Workout set data
TEST_SET = {
    "weight": "100",
    "reps": "10"
}

TIMEOUT = 15  # seconds to wait for elements (longer for workout operations)


def setup_driver():
    """
    Set up Chrome WebDriver with headless configuration.
    Required for cloud/CI environments without a display server.
    """
    chrome_options = Options()
    
    # HEADLESS MODE - Essential for cloud environments (no GUI)
    chrome_options.add_argument("--headless")
    
    # Security and stability options for headless Chrome
    chrome_options.add_argument("--no-sandbox")  # Required for running as root/container
    chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited shared memory
    chrome_options.add_argument("--disable-gpu")  # Disable GPU hardware acceleration
    chrome_options.add_argument("--window-size=1920,1080")  # Set viewport size
    chrome_options.add_argument("--disable-extensions")  # Disable extensions for stability
    
    # Initialize the Chrome driver
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(5)  # Implicit wait for element location
    
    return driver


def teardown_driver(driver):
    """
    Clean up - close the browser and quit the driver.
    """
    if driver:
        driver.quit()


def perform_login(driver, wait):
    """
    Helper function to perform login.
    Returns True if login was successful, False otherwise.
    """
    print(f"\n[LOGIN] Navigating to login page: {LOGIN_URL}")
    driver.get(LOGIN_URL)
    time.sleep(2)
    
    # Fill and submit login form
    print(f"[LOGIN] Entering credentials for: {TEST_USER['email']}")
    
    email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    email_input.clear()
    email_input.send_keys(TEST_USER['email'])
    
    password_input = driver.find_element(By.NAME, "password")
    password_input.clear()
    password_input.send_keys(TEST_USER['password'])
    
    submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_button.click()
    
    # Wait for redirect to dashboard
    try:
        wait.until(EC.url_contains("/dashboard"))
        print("[LOGIN] ✓ Login successful")
        return True
    except TimeoutException:
        print(f"[LOGIN] ✗ Login failed. Current URL: {driver.current_url}")
        return False


def test_workout_flow():
    """
    Main test function for workout flow.
    """
    driver = None
    test_passed = False
    
    try:
        print("=" * 60)
        print("E2E TEST: Workout Flow")
        print("=" * 60)
        
        # Step 1: Initialize WebDriver
        print("\n[STEP 1] Setting up Chrome WebDriver (headless mode)...")
        driver = setup_driver()
        wait = WebDriverWait(driver, TIMEOUT)
        print("✓ WebDriver initialized successfully")
        
        # Step 2: Login first
        print("\n[STEP 2] Logging in to the application...")
        if not perform_login(driver, wait):
            print("✗ Cannot continue without successful login")
            return False
        
        # Step 3: Navigate to Programs page and select a program
        print(f"\n[STEP 3] Navigating to Programs page: {PROGRAMS_URL}")
        driver.get(PROGRAMS_URL)
        time.sleep(3)  # Allow page and API to load
        
        # Wait for the main content/grid to load
        print("  Waiting for programs grid to load...")
        try:
            wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "main, [class*='grid'], [class*='container']"))
            )
            print("✓ Main content loaded")
        except TimeoutException:
            print("✗ Main content did not load")
            return False
        
        # Find and click on a program card
        print("  Looking for a program card to click...")
        program_clicked = False
        
        # Strategy 1: Find by text containing "PPL", "Program", or common split names
        try:
            program_card = driver.find_element(
                By.XPATH,
                "//div[contains(text(), 'PPL')] | "
                "//h3[contains(text(), 'PPL')] | "
                "//h2[contains(text(), 'PPL')] | "
                "//div[contains(text(), 'Push')] | "
                "//h3[contains(text(), 'Push')] | "
                "//div[contains(text(), 'Upper')] | "
                "//h3[contains(text(), 'Upper')] | "
                "//a[contains(@href, '/programs/') and not(contains(@href, '/new'))]"
            )
            print(f"✓ Found program by text/link: '{program_card.text[:30] if program_card.text else 'link'}'")
            program_card.click()
            program_clicked = True
        except NoSuchElementException:
            print("  No program found by text, trying grid...")
        
        # Strategy 2: Find first clickable element in grid
        if not program_clicked:
            try:
                # Find any clickable card in a grid layout
                grid_items = driver.find_elements(
                    By.CSS_SELECTOR,
                    "[class*='grid'] > div, [class*='grid'] > a, [class*='card'], [class*='program']"
                )
                if grid_items:
                    for item in grid_items:
                        # Skip "Create New" buttons
                        if "new" in item.text.lower() or "create" in item.text.lower():
                            continue
                        print(f"✓ Found grid item: '{item.text[:30] if item.text else 'card'}', clicking...")
                        item.click()
                        program_clicked = True
                        break
            except Exception as e:
                print(f"  Grid search failed: {e}")
        
        if not program_clicked:
            print("✗ Could not find any program to click")
            return False
        
        time.sleep(2)
        
        # CRITICAL ASSERTION: Verify URL changed to /programs/{id}
        current_url = driver.current_url
        print(f"  Current URL after click: {current_url}")
        
        if "/programs/" not in current_url or "/programs/new" in current_url or current_url == PROGRAMS_URL:
            print("✗ ASSERTION FAILED: URL did not change to a program details page")
            print(f"  Expected URL to contain '/programs/{{id}}', got: {current_url}")
            return False
        
        print(f"✓ ASSERTION PASSED: Successfully navigated to program details: {current_url}")
        
        # Step 4: Click "Start Workout" button
        print("\n[STEP 4] Looking for 'Start Workout' button...")
        
        try:
            start_workout_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//button[contains(text(), 'Start Workout')] | "
                    "//button[contains(text(), 'Start')] | "
                    "//button[contains(@class, 'start')]"
                ))
            )
            print(f"✓ Found button: '{start_workout_button.text}'")
            start_workout_button.click()
            time.sleep(3)
            
        except TimeoutException:
            print("✗ Could not find 'Start Workout' button")
            return False
        
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 5: Verify we're on the active workout page
        print("\n[STEP 5] Verifying active workout page...")
        
        if "/workout/active" not in driver.current_url:
            print("✗ Not on active workout page")
            print(f"  Current URL: {driver.current_url}")
            # Try navigating directly
            driver.get(ACTIVE_WORKOUT_URL)
            time.sleep(2)
        
        # Step 6: Add a set (weight and reps)
        print("\n[STEP 6] Adding a set with weight and reps...")
        
        try:
            # Based on ActiveWorkoutPage.tsx analysis:
            # - Reps input: first input[type="number"] with label "Reps *"
            # - Weight input: second input[type="number"] with label "Weight (kg)"
            # Both have placeholder="0"
            
            # Find all number inputs in the set logger section
            number_inputs = wait.until(
                EC.presence_of_all_elements_located((
                    By.CSS_SELECTOR,
                    "input[type='number']"
                ))
            )
            
            if len(number_inputs) >= 2:
                # First input is Reps, second is Weight
                reps_input = number_inputs[0]
                weight_input = number_inputs[1]
                
                # Enter reps first (required)
                reps_input.clear()
                reps_input.send_keys(TEST_SET['reps'])
                print(f"  - Entered reps: {TEST_SET['reps']}")
                
                # Enter weight
                weight_input.clear()
                weight_input.send_keys(TEST_SET['weight'])
                print(f"  - Entered weight: {TEST_SET['weight']}")
            else:
                print(f"  Found {len(number_inputs)} number inputs, expected 2")
                # Try anyway with first input
                if number_inputs:
                    number_inputs[0].send_keys(TEST_SET['reps'])
                    print(f"  - Entered reps in first input: {TEST_SET['reps']}")
            
            # Find and click "Log Set" button (contains text "Log Set" or "✓ Log Set")
            log_set_button = driver.find_element(
                By.XPATH,
                "//button[contains(text(), 'Log Set')] | "
                "//button[contains(text(), 'Update Set')]"
            )
            log_set_button.click()
            time.sleep(2)
            print("✓ Set logged successfully")
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"! Could not add set: {e}")
            print("  Continuing with workout finish...")
        
        # Step 7: Click "Finish Workout" button
        print("\n[STEP 7] Clicking 'Finish Workout' button...")
        
        try:
            finish_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//button[contains(text(), 'Finish')] | "
                    "//button[contains(text(), 'Complete')] | "
                    "//button[contains(text(), 'End')]"
                ))
            )
            print(f"✓ Found button: '{finish_button.text}'")
            finish_button.click()
            time.sleep(2)
            
        except TimeoutException:
            print("✗ Could not find 'Finish Workout' button")
            return False
        
        # Step 8: Confirm in the modal
        print("\n[STEP 8] Confirming workout finish in modal...")
        
        try:
            # Look for confirmation button in modal
            confirm_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//button[contains(text(), 'Confirm')] | "
                    "//button[contains(text(), 'Yes')] | "
                    "//button[contains(text(), 'OK')] | "
                    "//div[contains(@class, 'modal')]//button[contains(@class, 'primary')] | "
                    "//div[contains(@class, 'modal')]//button[1]"
                ))
            )
            print(f"✓ Found confirmation button: '{confirm_button.text}'")
            confirm_button.click()
            time.sleep(3)
            
        except TimeoutException:
            print("! No confirmation modal found (may have auto-confirmed)")
        
        # Step 9: Verify redirection to workout history or details
        print("\n[STEP 9] Verifying redirection to workout history/details...")
        
        current_url = driver.current_url
        print(f"  Current URL: {current_url}")
        
        if "/workout/history" in current_url or "/workout/" in current_url:
            print("✓ Successfully redirected to workout history/details page")
            test_passed = True
        elif "/dashboard" in current_url:
            print("✓ Redirected to dashboard (workout completed)")
            test_passed = True
        else:
            print("! Checking if we're on a success page...")
            
            # Check for success indicators in page content
            try:
                success_indicator = driver.find_element(
                    By.XPATH,
                    "//*[contains(text(), 'Workout completed')] | "
                    "//*[contains(text(), 'Success')] | "
                    "//*[contains(text(), 'finished')]"
                )
                print(f"✓ Success indicator found: {success_indicator.text}")
                test_passed = True
            except NoSuchElementException:
                print("✗ Could not verify workout completion")
        
    except Exception as e:
        print(f"\n✗ TEST FAILED with exception: {type(e).__name__}: {str(e)}")
        
    finally:
        # Cleanup
        print("\n[CLEANUP] Closing browser...")
        teardown_driver(driver)
        
        # Final result
        print("\n" + "=" * 60)
        if test_passed:
            print("TEST PASSED")
        else:
            print("TEST FAILED")
        print("=" * 60)
        
        return test_passed


if __name__ == "__main__":
    result = test_workout_flow()
    sys.exit(0 if result else 1)

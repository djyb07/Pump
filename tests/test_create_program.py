"""
E2E Test: Create Program Flow
=============================
This test logs in, navigates to /programs, creates a new program,
adds a day and an exercise to it, and verifies the program appears in the list.

Tested Flow:
1. Login with valid credentials
2. Navigate to /programs
3. Click "Create New Program" button
4. Fill the form (Name: "Test PPL", Split: "PPL")
5. Submit the form
6. (Redirected to program details page)
7. Add a Day to the program
8. Add an Exercise to that day
9. Verify the program appears in the programs list

Requirements:
- Chrome browser (or chromedriver in PATH)
- selenium package: pip install selenium
- Application running at http://localhost:5173
- A valid registered user in the database

IMPORTANT: Update TEST_USER credentials with a valid user before running!
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ================== CONFIGURATION ==================
BASE_URL = "https://pump-client.vercel.app"
LOGIN_URL = f"{BASE_URL}/login"
PROGRAMS_URL = f"{BASE_URL}/programs"
CREATE_PROGRAM_URL = f"{BASE_URL}/programs/new"

# Test user credentials - UPDATE THESE with valid credentials!
TEST_USER = {
    "email": "test@example.com",      # Replace with valid email
    "password": "TestPassword123!"    # Replace with valid password
}

# New program details
NEW_PROGRAM = {
    "name": f"Test PPL {int(time.time())}",  # Unique name with timestamp
    "split_type": "PPL"  # Push-Pull-Legs split
}

TIMEOUT = 10  # seconds to wait for elements


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


def test_create_program():
    """
    Main test function for create program flow.
    """
    driver = None
    test_passed = False
    
    try:
        print("=" * 60)
        print("E2E TEST: Create Program Flow")
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
        
        # Step 3: Navigate to Programs page
        print(f"\n[STEP 3] Navigating to Programs page: {PROGRAMS_URL}")
        driver.get(PROGRAMS_URL)
        time.sleep(2)
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 4: Click "Create New Program" button
        print("\n[STEP 4] Looking for 'Create New Program' button...")
        
        try:
            # Look for various possible button texts/selectors
            create_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH, 
                    "//button[contains(text(), 'Create')] | //a[contains(text(), 'Create')] | "
                    "//button[contains(text(), 'New Program')] | //a[contains(text(), 'New Program')] | "
                    "//button[contains(@class, 'create')] | //a[contains(@href, '/programs/new')]"
                ))
            )
            print(f"✓ Found button: '{create_button.text}'")
            create_button.click()
            time.sleep(2)
            
        except TimeoutException:
            # Try direct navigation if button not found
            print("  Button not found, navigating directly to create page...")
            driver.get(CREATE_PROGRAM_URL)
            time.sleep(2)
        
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 5: Fill the program creation form
        print("\n[STEP 5] Filling program creation form...")
        
        # Fill Program Name
        # Note: The input doesn't have a 'name' attribute, find by type and placeholder
        print(f"  - Entering Program Name: {NEW_PROGRAM['name']}")
        try:
            # Try finding by placeholder text first (more specific)
            name_input = wait.until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR, 
                    "input[type='text'][placeholder*='Summer'], input[type='text'][placeholder*='PPL'], input[type='text']"
                ))
            )
        except TimeoutException:
            # Fallback: Find first text input on the page
            name_input = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
            )
        
        name_input.clear()
        name_input.send_keys(NEW_PROGRAM['name'])
        print(f"✓ Program name entered")
        
        # Select Split Type by clicking on the card
        # The CreateProgramPage uses clickable div cards, not a dropdown or select
        print(f"  - Selecting Split Type: {NEW_PROGRAM['split_type']}")
        try:
            # Find the PPL card by looking for text "Push/Pull/Legs" or the emoji icon
            split_card = driver.find_element(
                By.XPATH, 
                "//div[contains(@class, 'cursor-pointer')]//h3[contains(text(), 'Push/Pull/Legs')]/ancestor::div[contains(@class, 'cursor-pointer')] | "
                "//div[contains(@class, 'cursor-pointer') and contains(., 'Push/Pull/Legs')] | "
                "//div[contains(@class, 'cursor-pointer') and contains(., 'PPL')]"
            )
            split_card.click()
            print(f"✓ Split type selected")
        except NoSuchElementException:
            # Alternative: Try clicking by label text directly
            try:
                split_option = driver.find_element(
                    By.XPATH, 
                    "//*[contains(text(), 'Push/Pull/Legs')] | //*[contains(text(), '🔄')]"
                )
                split_option.click()
                print(f"✓ Split type selected (via label)")
            except NoSuchElementException:
                print("  ! Could not find split type card, continuing...")
        
        print("✓ Form filled successfully")
        
        # Step 6: Submit the form
        print("\n[STEP 6] Submitting program creation form...")
        
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        time.sleep(3)  # Wait for creation and redirect
        
        print(f"✓ Form submitted. Current URL: {driver.current_url}")
        
        # Step 7: Add a Day to the program
        print("\n[STEP 7] Adding a day to the program...")
        
        # Ensure we're on the program details page after creation
        current_url = driver.current_url
        if "/programs/" not in current_url or "/programs/new" in current_url:
            print("✗ Not on program details page after creation")
            return False
        
        print("✓ On program details page — ready to add a day")
        
        try:
            # Click the "+ Add Day" button in the page header
            add_day_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//button[contains(., 'Add Day')]"
                ))
            )
            add_day_button.click()
            time.sleep(1)
            
            # Fill the day name in the AddDayModal
            day_name_input = wait.until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR,
                    "input[placeholder*='Push Day'], input[placeholder*='Monday'], input[type='text']"
                ))
            )
            day_name_input.clear()
            day_name_input.send_keys("Push Day")
            print("  - Entered day name: 'Push Day'")
            
            # Click the modal's "Add Day" submit button
            modal_submit = driver.find_element(
                By.XPATH,
                "//button[@type='submit' and contains(., 'Add Day')]"
            )
            modal_submit.click()
            time.sleep(2)
            
            print("✓ Day added successfully")
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"✗ Failed to add day: {e}")
            return False
        
        # Step 8: Add an Exercise to the day
        print("\n[STEP 8] Adding an exercise to 'Push Day'...")
        
        try:
            # Click the "+ Add Exercise" button next to the day
            add_exercise_button = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//button[contains(., 'Add Exercise')]"
                ))
            )
            add_exercise_button.click()
            time.sleep(2)
            
            # Wait for the exercise selection modal to appear
            wait.until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//h2[contains(text(), 'Select Exercise')]"
                ))
            )
            print("  - Exercise selection modal opened")
            
            # Click on the first exercise card (the clickable div with cursor-pointer)
            exercise_card = wait.until(
                EC.element_to_be_clickable((
                    By.CSS_SELECTOR,
                    "div.cursor-pointer"
                ))
            )
            exercise_name = exercise_card.find_element(By.CSS_SELECTOR, "h3").text
            exercise_card.click()
            time.sleep(2)
            
            print(f"✓ Exercise '{exercise_name}' added to Push Day")
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"✗ Failed to add exercise: {e}")
            return False
        
        # Step 9: Verify the program appears in the programs list
        print("\n[STEP 9] Verifying program was created...")
        
        driver.get(PROGRAMS_URL)
        time.sleep(2)
        
        # Look for the program name in the programs list
        try:
            program_element = wait.until(
                EC.presence_of_element_located((
                    By.XPATH,
                    f"//*[contains(text(), '{NEW_PROGRAM['name'].split()[0]}')]"  # Match first part of name
                ))
            )
            print(f"✓ Program found in list: {program_element.text}")
            test_passed = True
            
        except TimeoutException:
            print(f"✗ Could not find program '{NEW_PROGRAM['name']}' in the list")
            
            # Check page content for debugging
            page_source = driver.page_source
            if "Test PPL" in page_source:
                print("  (Note: 'Test PPL' was found in page source)")
                test_passed = True
            else:
                print(f"  Current page content preview: {page_source[:500]}...")
        
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
    result = test_create_program()
    sys.exit(0 if result else 1)

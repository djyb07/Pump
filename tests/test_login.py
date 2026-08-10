"""
E2E Test: User Login Flow
=========================
This test navigates to /login, enters valid credentials,
submits the form, and verifies redirection to the Dashboard.

Tested Flow:
1. Navigate to /login
2. Enter valid email and password
3. Submit the form
4. Verify redirect to /dashboard
5. Verify dashboard element is present

Requirements:
- Chrome browser (or chromedriver in PATH)
- selenium package: pip install selenium
- Application running at PUMP_BASE_URL (default http://localhost:5173)
- A valid registered user in the database

Credentials are read from PUMP_TEST_EMAIL / PUMP_TEST_PASSWORD. There is no
default - the test fails immediately if they are not set.
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from config import BASE_URL, require_credentials

# ================== CONFIGURATION ==================
LOGIN_URL = f"{BASE_URL}/login"
DASHBOARD_URL = f"{BASE_URL}/dashboard"

# Credentials come from PUMP_TEST_EMAIL / PUMP_TEST_PASSWORD - see config.py
TEST_USER = require_credentials()

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


def test_login():
    """
    Main test function for user login flow.
    """
    driver = None
    test_passed = False
    
    try:
        print("=" * 60)
        print("E2E TEST: User Login Flow")
        print("=" * 60)
        
        # Step 1: Initialize WebDriver
        print("\n[STEP 1] Setting up Chrome WebDriver (headless mode)...")
        driver = setup_driver()
        print("✓ WebDriver initialized successfully")
        
        # Step 2: Navigate to login page
        print(f"\n[STEP 2] Navigating to login page: {LOGIN_URL}")
        driver.get(LOGIN_URL)
        time.sleep(2)  # Allow page to fully load
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 3: Locate and fill in the login form fields
        print("\n[STEP 3] Filling in login credentials...")
        
        # Wait for the form to be visible
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Fill Email
        print(f"  - Entering Email: {TEST_USER['email']}")
        email_input = wait.until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.clear()
        email_input.send_keys(TEST_USER['email'])
        
        # Fill Password
        print(f"  - Entering Password: {'*' * len(TEST_USER['password'])}")
        password_input = driver.find_element(By.NAME, "password")
        password_input.clear()
        password_input.send_keys(TEST_USER['password'])
        
        print("✓ Credentials entered successfully")
        
        # Step 4: Submit the login form
        print("\n[STEP 4] Submitting login form...")
        
        # Find and click the submit button
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        print("✓ Form submitted")
        
        # Step 5: Verify redirection to Dashboard
        print("\n[STEP 5] Verifying redirect to Dashboard...")
        
        # Wait for URL to change to dashboard
        try:
            wait.until(EC.url_contains("/dashboard"))
            current_url = driver.current_url
            
            if "/dashboard" in current_url:
                print(f"✓ Successfully redirected to Dashboard: {current_url}")
                
                # Step 6: Verify dashboard element is present
                print("\n[STEP 6] Verifying Dashboard content...")
                
                # Look for a dashboard-specific element
                # This could be a welcome message, navigation, or any dashboard component
                try:
                    # Wait for dashboard content to load
                    time.sleep(2)
                    
                    # Check for common dashboard elements - adjust selector as needed
                    # Options: Look for header, navigation, welcome message, or specific component
                    dashboard_element = wait.until(
                        EC.presence_of_element_located((
                            By.CSS_SELECTOR, 
                            "[class*='dashboard'], h1, [class*='welcome'], nav, [class*='header']"
                        ))
                    )
                    print(f"✓ Dashboard element found: <{dashboard_element.tag_name}>")
                    
                    # Additional verification: Check page title or specific text
                    page_title = driver.title
                    print(f"✓ Page title: {page_title}")
                    
                    test_passed = True
                    
                except TimeoutException:
                    print("✗ Could not find dashboard-specific element")
                    print(f"  Page source preview: {driver.page_source[:500]}...")
            else:
                print(f"✗ Unexpected URL after login: {current_url}")
                
        except TimeoutException:
            current_url = driver.current_url
            print(f"✗ Timeout waiting for redirect. Current URL: {current_url}")
            
            # Check for any error messages on the page
            try:
                error_element = driver.find_element(By.CSS_SELECTOR, "[class*='error'], [class*='alert']")
                print(f"  Error message found: {error_element.text}")
            except NoSuchElementException:
                print("  No error message found on page")
        
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
    # NOTE: outside the finally block on purpose. A `return` inside
    # `finally` discards any exception still propagating, which is how a
    # UnicodeEncodeError became a silent, undiagnosable "TEST FAILED".
    return test_passed


if __name__ == "__main__":
    result = test_login()
    sys.exit(0 if result else 1)

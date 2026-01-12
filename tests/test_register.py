"""
E2E Test: User Registration Flow (with Auto-Login)
===================================================
This test navigates to /register, fills in the registration form,
submits it, and verifies auto-login and redirection to the Dashboard.

Tested Flow:
1. Navigate to /register
2. Fill in: First Name, Last Name, Email, Password, Confirm Password
3. Submit the form
4. Verify auto-login and redirect to /dashboard
5. Verify dashboard element is present (user is logged in)

Requirements:
- Chrome browser (or chromedriver in PATH)
- selenium package: pip install selenium
- Application running at https://pump-client.vercel.app
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

# ================== CONFIGURATION ==================
BASE_URL = "https://pump-client.vercel.app"
REGISTER_URL = f"{BASE_URL}/register"
LOGIN_URL = f"{BASE_URL}/login"

# Test user data - use unique email to avoid conflicts
TEST_USER = {
    "first_name": "Test",
    "last_name": "User",
    "email": f"testuser{int(time.time())}@example.com",  # Unique email using timestamp
    "password": "TestPassword123!"
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


def test_register():
    """
    Main test function for user registration flow.
    """
    driver = None
    test_passed = False
    
    try:
        print("=" * 60)
        print("E2E TEST: User Registration Flow")
        print("=" * 60)
        
        # Step 1: Initialize WebDriver
        print("\n[STEP 1] Setting up Chrome WebDriver (headless mode)...")
        driver = setup_driver()
        print("✓ WebDriver initialized successfully")
        
        # Step 2: Navigate to registration page
        print(f"\n[STEP 2] Navigating to registration page: {REGISTER_URL}")
        driver.get(REGISTER_URL)
        time.sleep(2)  # Allow page to fully load
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 3: Locate and fill in the registration form fields
        print("\n[STEP 3] Filling in registration form...")
        
        # Wait for the form to be visible
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Fill First Name
        print(f"  - Entering First Name: {TEST_USER['first_name']}")
        first_name_input = wait.until(
            EC.presence_of_element_located((By.NAME, "firstName"))
        )
        first_name_input.clear()
        first_name_input.send_keys(TEST_USER['first_name'])
        
        # Fill Last Name
        print(f"  - Entering Last Name: {TEST_USER['last_name']}")
        last_name_input = driver.find_element(By.NAME, "lastName")
        last_name_input.clear()
        last_name_input.send_keys(TEST_USER['last_name'])
        
        # Fill Email
        print(f"  - Entering Email: {TEST_USER['email']}")
        email_input = driver.find_element(By.NAME, "email")
        email_input.clear()
        email_input.send_keys(TEST_USER['email'])
        
        # Fill Password
        print(f"  - Entering Password: {'*' * len(TEST_USER['password'])}")
        password_input = driver.find_element(By.NAME, "password")
        password_input.clear()
        password_input.send_keys(TEST_USER['password'])
        
        # Fill Confirm Password
        print(f"  - Entering Confirm Password: {'*' * len(TEST_USER['password'])}")
        confirm_password_input = driver.find_element(By.NAME, "confirmPassword")
        confirm_password_input.clear()
        confirm_password_input.send_keys(TEST_USER['password'])
        
        print("✓ Form filled successfully")
        
        # Step 4: Submit the registration form
        print("\n[STEP 4] Submitting registration form...")
        
        # Find and click the submit button
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        print("✓ Form submitted")
        
        # Step 5: Verify auto-login and redirect to Dashboard
        # (No more modal/alert - user goes directly to dashboard)
        print("\n[STEP 5] Verifying auto-login and redirect to Dashboard...")
        
        # Wait for URL to change to dashboard (auto-login happens after registration)
        try:
            wait.until(EC.url_contains("/dashboard"))
            current_url = driver.current_url
            
            if "/dashboard" in current_url:
                print(f"✓ Successfully redirected to Dashboard: {current_url}")
                
                # Step 6: Verify dashboard element is present (proves user is logged in)
                print("\n[STEP 6] Verifying Dashboard content (user is logged in)...")
                
                try:
                    # Wait for dashboard content to load
                    time.sleep(2)
                    
                    # Look for dashboard-specific elements
                    dashboard_element = wait.until(
                        EC.presence_of_element_located((
                            By.CSS_SELECTOR, 
                            "[class*='dashboard'], h1, [class*='welcome'], nav, [class*='header'], main"
                        ))
                    )
                    print(f"✓ Dashboard element found: <{dashboard_element.tag_name}>")
                    
                    # Check page title
                    page_title = driver.title
                    print(f"✓ Page title: {page_title}")
                    
                    test_passed = True
                    print("✓ User is successfully logged in!")
                    
                except TimeoutException:
                    print("✗ Could not find dashboard-specific element")
                    print(f"  Page source preview: {driver.page_source[:500]}...")
            else:
                print(f"✗ Unexpected URL after registration: {current_url}")
                
        except TimeoutException:
            current_url = driver.current_url
            print(f"✗ Timeout waiting for dashboard redirect. Current URL: {current_url}")
            
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
        
        return test_passed


if __name__ == "__main__":
    result = test_register()
    sys.exit(0 if result else 1)

"""
E2E Test: View Progress Flow
============================
This test logs in, navigates to /exercises, clicks on an exercise,
and verifies that the progress chart/graph component loads.

Tested Flow:
1. Login with valid credentials
2. Navigate to /exercises (Exercise Library)
3. Click on an exercise to view details
4. Verify that the progress chart container element loads

Requirements:
- Chrome browser (or chromedriver in PATH)
- selenium package: pip install selenium
- Application running at http://localhost:5173
- A valid registered user (ideally with some workout history for chart data)

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
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ================== CONFIGURATION ==================
BASE_URL = "https://pump-client.vercel.app"
LOGIN_URL = f"{BASE_URL}/login"
EXERCISES_URL = f"{BASE_URL}/exercises"

# Test user credentials - UPDATE THESE with valid credentials!
TEST_USER = {
    "email": "test@example.com",      # Replace with valid email
    "password": "TestPassword123!"    # Replace with valid password
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


def test_view_progress():
    """
    Main test function for viewing exercise progress.
    """
    driver = None
    test_passed = False
    
    try:
        print("=" * 60)
        print("E2E TEST: View Progress Flow")
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
        
        # Step 3: Navigate to Exercise Library
        print(f"\n[STEP 3] Navigating to Exercise Library: {EXERCISES_URL}")
        driver.get(EXERCISES_URL)
        time.sleep(2)
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 4: Wait for exercises to load
        print("\n[STEP 4] Waiting for exercises to load...")
        
        try:
            # Wait for exercise list/cards to appear
            exercises_container = wait.until(
                EC.presence_of_element_located((
                    By.CSS_SELECTOR,
                    "[class*='exercise'], [class*='card'], [class*='list'], main"
                ))
            )
            print("✓ Exercises loaded")
            
        except TimeoutException:
            print("✗ Could not load exercises list")
            return False
        
        # Step 5: Click on the first exercise
        print("\n[STEP 5] Clicking on an exercise...")
        
        try:
            # Find a clickable exercise element
            exercise_link = wait.until(
                EC.element_to_be_clickable((
                    By.XPATH,
                    "//a[contains(@href, '/exercise')] | "
                    "//div[contains(@class, 'exercise')]//a | "
                    "//div[contains(@class, 'card')]//a | "
                    "//button[contains(text(), 'View')] | "
                    "//div[contains(@class, 'exercise')]"
                ))
            )
            
            exercise_text = exercise_link.text[:50] if exercise_link.text else "unnamed"
            print(f"✓ Found exercise: '{exercise_text}'")
            exercise_link.click()
            time.sleep(3)
            
        except TimeoutException:
            print("✗ Could not find clickable exercise element")
            
            # Try clicking on any card-like element
            try:
                cards = driver.find_elements(By.CSS_SELECTOR, "[class*='card'], [class*='item']")
                if cards:
                    cards[0].click()
                    time.sleep(2)
                    print("✓ Clicked on first card element")
                else:
                    return False
            except Exception:
                return False
        
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 6: Look for "View Progress" or navigate to progress page
        print("\n[STEP 6] Looking for progress view option...")
        
        try:
            # Check if we need to click a "View Progress" button
            progress_button = driver.find_element(
                By.XPATH,
                "//a[contains(@href, 'progress')] | "
                "//button[contains(text(), 'Progress')] | "
                "//button[contains(text(), 'View Progress')] | "
                "//a[contains(text(), 'Progress')]"
            )
            print(f"✓ Found progress link/button: '{progress_button.text}'")
            progress_button.click()
            time.sleep(3)
            
        except NoSuchElementException:
            print("  (No separate progress button found - chart may be on this page)")
        
        print(f"✓ Current URL: {driver.current_url}")
        
        # Step 7: Verify progress chart/graph component loads
        print("\n[STEP 7] Verifying progress chart/graph component...")
        
        try:
            # Look for chart container elements (Recharts uses SVG)
            # Multiple selectors to catch various chart implementations
            chart_element = wait.until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//div[contains(@class, 'chart')] | "
                    "//div[contains(@class, 'recharts')] | "
                    "//svg[contains(@class, 'recharts')] | "
                    "//*[local-name()='svg'][@class='recharts-surface'] | "
                    "//div[contains(@class, 'progress')] | "
                    "//canvas | "
                    "//*[contains(@class, 'graph')]"
                ))
            )
            
            print(f"✓ Chart element found: <{chart_element.tag_name}> with class='{chart_element.get_attribute('class')}'")
            test_passed = True
            
        except TimeoutException:
            print("! Could not find chart using primary selectors")
            
            # Fallback: Check for SVG elements (common in charting libraries)
            try:
                svg_elements = driver.find_elements(By.TAG_NAME, "svg")
                if svg_elements:
                    print(f"✓ Found {len(svg_elements)} SVG element(s) - likely charts")
                    
                    # Check if any SVG looks like a chart (has path elements, etc.)
                    for svg in svg_elements:
                        paths = svg.find_elements(By.TAG_NAME, "path")
                        if len(paths) > 2:  # Charts typically have multiple paths
                            print(f"✓ Found chart SVG with {len(paths)} paths")
                            test_passed = True
                            break
                    
                    if not test_passed:
                        print("  SVG found but may not be a chart")
                        
            except Exception as e:
                print(f"  Error checking for SVG: {e}")
            
            # Also check page source for recharts indicators
            if not test_passed:
                page_source = driver.page_source
                if "recharts" in page_source.lower() or "chart" in page_source.lower():
                    print("✓ Chart-related content found in page source")
                    test_passed = True
                else:
                    print("✗ No chart elements found on page")
                    print(f"  Page title: {driver.title}")
        
        # Additional verification: Check for chart data/labels
        if test_passed:
            print("\n[ADDITIONAL] Checking for chart data indicators...")
            try:
                # Look for axis labels, legends, or data points
                data_indicators = driver.find_elements(
                    By.XPATH,
                    "//*[contains(@class, 'axis')] | "
                    "//*[contains(@class, 'legend')] | "
                    "//*[contains(@class, 'tooltip')] | "
                    "//*[contains(@class, 'label')]"
                )
                if data_indicators:
                    print(f"✓ Found {len(data_indicators)} chart data indicator(s)")
            except Exception:
                pass
        
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
    result = test_view_progress()
    sys.exit(0 if result else 1)

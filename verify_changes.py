from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the preview server
            page.goto("http://localhost:3000")

            # Wait for main container to ensure app is loaded
            page.wait_for_selector(".app-container", timeout=10000)

            # Verify Favicon (by checking link tag)
            favicon = page.locator("link[rel='icon']")
            if favicon.get_attribute("href") == "/favicon.png":
                print("Favicon verification passed: href is /favicon.png")
            else:
                print(f"Favicon verification failed: href is {favicon.get_attribute('href')}")

            # 1. Desktop Screenshot
            page.set_viewport_size({"width": 1280, "height": 800})
            time.sleep(1) # Allow for any transitions
            page.screenshot(path="verification_desktop.png")
            print("Desktop screenshot captured.")

            # 2. Mobile Screenshot
            page.set_viewport_size({"width": 375, "height": 800})
            time.sleep(1) # Allow for layout adjustment
            page.screenshot(path="verification_mobile.png")
            print("Mobile screenshot captured.")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()

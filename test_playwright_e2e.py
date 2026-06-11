import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_test():
    print("Launching browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
        page.on("requestfailed", lambda req: print(f"[REQ FAILED] {req.method} {req.url} - {req.failure.error_text}"))

        print("Navigating to http://localhost:3000/dashboard ...")
        page.goto("http://localhost:3000/dashboard")
        page.wait_for_load_state("networkidle")

        print("Page loaded. Checking page title...")
        title = page.title()
        print(f"Page title: {title}")

        print("Populating input with mock repository/issue url...")
        input_field = page.locator("input[placeholder='https://github.com/owner/repo/issues/42']")
        input_field.fill("https://github.com/test/repo/issues/1")
        val = input_field.input_value()
        print(f"Input populated with: {val}")

        print("Submitting the form...")
        submit_btn = page.locator("button[type='submit']")
        submit_btn.click()

        # Wait for transition to the live run view
        print("Waiting for run page...")
        page.wait_for_selector("text=Live Swarm Run", timeout=15000)
        print("Live Swarm Run page is visible!")

        # We can extract the run ID from the URL or text
        run_id_element = page.locator("p.text-sm.text-muted-foreground.font-mono")
        run_id_text = run_id_element.inner_text()
        print(f"Run info line: {run_id_text}")

        # Now wait for the status to show completed or failed.
        print("Waiting for swarm execution to complete (may take 20-60 seconds)...")
        start_time = time.time()
        success = False
        
        while time.time() - start_time < 90:
            text = run_id_element.inner_text()
            print(f"[{int(time.time() - start_time)}s] Current status: {text}")
            
            if "completed" in text.lower():
                print("Swarm run COMPLETED successfully!")
                success = True
                break
            elif "failed" in text.lower():
                print("Swarm run FAILED!")
                break
            
            # Also let's print the latest messages from the chat if visible
            try:
                latest_chat = page.locator(".chat-bubble, [class*='message']").last.inner_text()
                if latest_chat:
                    print(f"   Latest chat: {latest_chat.strip()[:80]}...")
            except Exception as e:
                pass
                
            time.sleep(5)
        
        # Take a screenshot to verify UI rendered correctly
        screenshot_path = "swarm_completed_screenshot.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()
        
        if success:
            print("\nTest passed!")
            sys.exit(0)
        else:
            print("\nTest failed or timed out!")
            sys.exit(1)

if __name__ == "__main__":
    run_test()

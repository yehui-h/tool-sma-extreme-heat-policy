# tests/test_home.py

from playwright.sync_api import Page, expect


class TestHomePage:
    def test_visibility_text(self, page: Page) -> None:
        """Verify key elements are visible and updating the location displays the map and recommendations."""
        # Navigate to the home page (conftest patches relative URLs and defaults wait_until)
        page.goto("/")

        # Wait for essential elements to be visible (remote runs can be slower)
        page.wait_for_selector("#id-dropdown-sport", state="visible", timeout=30000)
        page.wait_for_selector("#id-dropdown-location", state="visible", timeout=30000)

        # Check header link, default sport selection and sport image
        expect(page.get_by_text("Sports Heat Tool")).to_be_visible(timeout=15000)
        expect(page.locator("#id-dropdown-sport")).to_be_visible(timeout=15000)
        expect(page.locator("#id-sport-image").get_by_role("img")).to_be_visible(timeout=15000)

        # Change the location (type + enter) and wait for results
        page.locator("#id-dropdown-location").click()
        page.locator("#id-dropdown-location").type("2205 arn")
        page.locator("#id-dropdown-location").press("Enter")

        # Validate map and recommendations sections
        page.wait_for_selector("#id-map", state="visible", timeout=30000)
        expect(page.locator("#id-map")).to_be_visible(timeout=15000)
        expect(page.get_by_role("heading", name="Key recommendations:")).to_be_visible(timeout=15000)
        expect(page.get_by_role("button", name="Detailed suggestions:")).to_be_visible(timeout=15000)
        expect(page.get_by_role("heading", name="Forecasted risk for today")).to_be_visible(timeout=15000)
        expect(page.locator("#id-button-install")).to_be_visible(timeout=15000)
        expect(page.get_by_role("link", name="Provide your")).to_be_visible(timeout=15000)

    def test_click_dropdown(self, page: Page):
        """Test that selecting a sport updates the sport image correctly."""
        page.goto("/")

        # Wait for dropdown to be ready
        page.wait_for_selector("#id-dropdown-sport", state="visible", timeout=20000)

        # Map display names to image slugs
        sport_image_map = {
            "abseiling": "abseiling",
            "cricket": "cricket",
            "fishing": "fishing",
            "running": "field_athletics",  # 'running' displays 'field_athletics.webp'
        }

        for sport, image_slug in sport_image_map.items():
            page.locator("#id-dropdown-sport").click()
            page.locator("#id-dropdown-sport").get_by_role("combobox").fill(sport)
            page.locator("#id-dropdown-sport").get_by_role("combobox").press("Enter")
            # Wait for potential network activity and image update
            page.wait_for_timeout(500)  # short pause to allow frontend to update
            # Verify sport image updates to the correct slug
            expect(
                page.locator("#id-sport-image").get_by_role("img")
            ).to_have_attribute("src", f"/assets/images/{image_slug}.webp", timeout=10000)

    def test_selecting_non_existent_sport(self, page: Page):
        page.goto("/")
        page.wait_for_selector("#id-dropdown-sport", state="visible", timeout=15000)
        page.locator("#id-dropdown-sport").get_by_role("combobox").fill("fede")
        # Wait for the 'No results found' entry to appear before clicking
        page.get_by_text("No results found").wait_for(state="visible", timeout=10000)
        page.get_by_text("No results found").click()

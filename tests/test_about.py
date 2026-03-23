from playwright.sync_api import Page, expect


class TestAboutPage:
    def test_has_url(self, page: Page):
        # Navigate and wait until network is idle so slower remote pages finish loading
        page.goto("/about")
        expect(page.get_by_text("Functionalities")).to_be_visible(timeout=15000)

    def test_about_navbar_links(self, page: Page):
        # Navigate and wait for the page to load first (new page fixture)
        page.goto("/about")

        # Verify visibility and functionality of navbar links on the About page.
        nav_links = ["Home", "About"]

        # Check each navbar link for visibility
        for link_text in nav_links:
            expect(page.get_by_role("link", name=link_text)).to_be_visible(
                timeout=15000
            )

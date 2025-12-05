"""Pytest configuration for Playwright tests.

Sets global expect timeout for all Playwright assertions.
"""

import os
import pathlib
import time
import pytest
from playwright.sync_api import expect


def pytest_configure():
    expect.set_options(timeout=20_000)


@pytest.fixture(autouse=True)
def _patch_page_goto(monkeypatch, request):
    """
    Monkeypatch Playwright's Page.goto to support relative URLs and add a default wait state.
    It requires a base URL to be provided via --base-url or a BASE_URL environment variable,
    skipping tests otherwise to prevent connection errors.
    """
    try:
        from playwright.sync_api import Page as PlaywrightPage
    except ImportError:
        yield
        return

    base_url = request.config.getoption("--base-url") or os.environ.get("BASE_URL")

    if not base_url:
        pytest.skip("Tests require a base URL. Provide it with --base-url or the BASE_URL environment variable.")

    original_goto = PlaywrightPage.goto

    def _patched_goto(self, url, *args, **kwargs):
        if isinstance(url, str) and url.startswith("/"):
            url = base_url.rstrip("/") + url

        if "wait_until" not in kwargs:
            kwargs["wait_until"] = "domcontentloaded"

        return original_goto(self, url, *args, **kwargs)

    monkeypatch.setattr(PlaywrightPage, "goto", _patched_goto, raising=False)
    yield


def _ensure_artifact_dir():
    p = pathlib.Path(".pytest_artifacts")
    p.mkdir(parents=True, exist_ok=True)
    return p


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    On test failure, if a Playwright 'page' fixture is present, save a screenshot and page HTML.
    """
    outcome = yield
    report = outcome.get_result()

    if report.when != "call" or not report.failed:
        return

    try:
        page = item.funcargs.get("page")
        if page is None:
            return

        art_dir = _ensure_artifact_dir()
        safe_name = f"{item.name.replace('[', '-').replace(']', '')}-{int(time.time())}"

        screenshot_path = art_dir / f"{safe_name}.png"
        html_path = art_dir / f"{safe_name}.html"

        page.screenshot(path=str(screenshot_path), full_page=True)
        html = page.content()
        html_path.write_text(html, encoding="utf-8")

        # Add artifact paths to the test report
        if hasattr(report.longrepr, "addsection"):
            report.longrepr.addsection("Playwright Artifacts", f"Screenshot: {screenshot_path}\nHTML: {html_path}")
    except Exception as e:
        if hasattr(report.longrepr, "addsection"):
            report.longrepr.addsection("Artifacts Error", f"Failed to capture page artifacts: {e}")

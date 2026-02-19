from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from sma_extreme_heat_backend.core.errors import ConfigurationError, MapboxProviderError


@dataclass(frozen=True)
class RetrievedCoordinates:
    latitude: float
    longitude: float
    raw: dict[str, Any]


class MapboxClient:
    def __init__(
        self,
        *,
        base_url: str,
        access_token: str,
        timeout_seconds: float,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.access_token = access_token.strip()
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout_seconds,
        )

    async def retrieve_coordinates(
        self,
        *,
        mapbox_id: str,
        session_token: str,
    ) -> RetrievedCoordinates:
        if not self.access_token:
            raise ConfigurationError("MAPBOX_ACCESS_TOKEN is required for Mapbox retrieve")

        try:
            path = f"/search/searchbox/v1/retrieve/{quote(mapbox_id, safe='')}"
            response = await self._client.get(
                path,
                params={
                    "access_token": self.access_token,
                    "session_token": session_token,
                },
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise MapboxProviderError() from exc

        features = payload.get("features")
        if not isinstance(features, list) or not features:
            raise MapboxProviderError("Mapbox retrieve response did not include features")

        first_feature = features[0]
        if not isinstance(first_feature, dict):
            raise MapboxProviderError("Mapbox retrieve response feature format was invalid")

        geometry = first_feature.get("geometry")
        if not isinstance(geometry, dict):
            raise MapboxProviderError("Mapbox retrieve response geometry was missing")

        coordinates = geometry.get("coordinates")
        if not isinstance(coordinates, list) or len(coordinates) < 2:
            raise MapboxProviderError("Mapbox retrieve response coordinates were missing")

        try:
            longitude = float(coordinates[0])
            latitude = float(coordinates[1])
        except (TypeError, ValueError) as exc:
            raise MapboxProviderError("Mapbox retrieve coordinates were invalid") from exc

        return RetrievedCoordinates(latitude=latitude, longitude=longitude, raw=payload)

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

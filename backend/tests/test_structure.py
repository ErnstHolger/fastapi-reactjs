import logging
import os
import uuid

import pytest
from adh_sample_library_preview import MetadataItem, SdsTypeCode
from adh_sample_library_preview.Asset import Asset
from dotenv import load_dotenv
from fastapi.testclient import TestClient

from app.client import NAMESPACE_ID, get_adh_client
from app.main import app
from app.model import create_ml_asset

load_dotenv()


@pytest.mark.integration
def test_create_asset():
    client = get_adh_client()
    assert client is not None
    asset = Asset(id="id", name="name", description="description")
    client.Assets.createOrUpdateAsset(NAMESPACE_ID, asset)


def debug_print(message, success=True):
    status = "✓" if success else "✗"
    print(f"{status} {message}")


@pytest.mark.integration
def test_create_meta():
    client = get_adh_client()
    assert client is not None

    results = {}
    created_assets = []

    for sds_type_code in SdsTypeCode:
        asset_id = f"test_asset_{sds_type_code.name}_{uuid.uuid4().hex[:8]}"

        try:
            asset = Asset(
                id=asset_id,
                name=f"Test Asset {sds_type_code.name}",
                description=f"Test asset for {sds_type_code.name}",
            )

            asset.Metadata = [
                MetadataItem(
                    id=f"metadata_{sds_type_code.name}_{uuid.uuid4().hex[:8]}",
                    name=f"Metadata {sds_type_code.name}",
                    description=f"Test metadata for {sds_type_code.name}",
                    sds_type_code=sds_type_code,
                )
            ]

            response = client.Assets.createOrUpdateAsset(NAMESPACE_ID, asset)
            created_assets.append(asset_id)
            results[sds_type_code.name] = True
            debug_print(f"{sds_type_code.name}: Asset created successfully")

        except Exception as e:
            results[sds_type_code.name] = False
            debug_print(f"{sds_type_code.name}: Failed - {type(e).__name__}")

    # Cleanup created assets
    for asset_id in created_assets:
        try:
            client.Assets.deleteAsset(NAMESPACE_ID, asset_id)
        except Exception as e:
            print(f"Warning: Failed to cleanup asset {asset_id}: {e}")

    # Assert that at least some worked (adjust based on your requirements)
    successful_count = sum(results.values())
    total_count = len(results)
    print(f"Summary: {successful_count}/{total_count} asset creations succeeded")

    assert successful_count > 0, (
        f"No assets were created successfully. Results: {results}"
    )


@pytest.mark.integration
def test_create_model():
    client = get_adh_client()
    assert client is not None
    for city in ["TALLAHASSEE", "TAMPA", "JACKSONVILLE", "MIAMI"]:
        result = create_ml_asset(
            id=f"indyiq_forecast_{city.lower()}_model",
            name=f"{city.lower()}_model",
            description=f"{city.lower()}_model",
            model_type="LinearRegression",
            sampling_rate=5,
            past_covariates=[
                f"{city}_FL_CLOUDS_CURRENT",
                f"{city}_FL_FEELS_LIKE_CURRENT",
                f"{city}_FL_HUMIDITY_CURRENT",
                f"{city}_FL_PRESSURE_CURRENT",
                f"{city}_FL_VISIBILITY_CURRENT",
                f"{city}_FL_WIND_DIRECTION_CURRENT",
                f"{city}_FL_WIND_SPEED_CURRENT",
            ],
            target=[f"{city}_FL_TEMPERATURE_CURRENT"],
            future_covariates=[],
            training_horizon=1_000,
            forecast_horizon=100,
            update_frequency=30,
            retrain_frequency=7_200,
        )

    assert result, f"No assets were created successfully. Results: {result}"

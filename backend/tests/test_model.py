import uuid

import pytest

from app.client import NAMESPACE_ID, get_adh_client
from app.model import create_ml_asset, create_ml_type


@pytest.mark.integration
def test_create_ml_type_integration(adh_client, namespace_id):
    """Test ML type creation with real ADH client."""
    ml_type = create_ml_type()

    # Verify the type was created
    assert ml_type is not None
    assert hasattr(ml_type, "Id")
    assert ml_type.Id == "model_forecast"


@pytest.mark.integration
@pytest.mark.slow
def test_create_ml_asset_integration(adh_client, namespace_id):
    """Test ML asset creation with real ADH client."""
    # Create a unique ID for testing
    unique_id = f"test-model-{uuid.uuid4().hex[:8]}"
    client = get_adh_client()
    try:
        # First create the type
        reference_type = create_ml_type()
        streams = client.Streams.getStreams(NAMESPACE_ID)
        # Create the asset
        result = create_ml_asset(
            id=unique_id,
            name="Integration Test Model",
            description="Test model created during integration testing",
            past_covariates=[streams[0].Id, streams[1].Id],
            target=[streams[2].Id],
            future_covariates=None,
            training_horizon=100,
            forecast_horizon=50,
            update_frequency=1,
            retrain_frequency=7,
            reference_type=reference_type.Id,
        )

        # Verify the asset was created
        assert result is not None
        assert hasattr(result, "Id")
        assert result.Id == unique_id

    except Exception as e:
        pytest.fail(f"Asset creation failed: {str(e)}")

    finally:
        # Cleanup: try to delete the test asset
        try:
            adh_client.Assets.deleteAsset(namespace_id, unique_id)
        except:
            pass  # Ignore cleanup errors


@pytest.mark.integration
def test_create_ml_asset_with_none_inputs_integration(adh_client, namespace_id):
    """Test ML asset creation with None inputs/outputs using real ADH client."""
    # Create a unique ID for testing
    unique_id = f"test-model-none-{uuid.uuid4().hex[:8]}"

    try:
        # First create the type
        reference_type = create_ml_type()

        # Create the asset with None inputs/outputs
        result = create_ml_asset(
            id=unique_id,
            name="Test Model with None Inputs",
            description="Test model with None inputs/outputs",
            inputs=None,  # Test None inputs
            outputs=None,  # Test None outputs
            training_horizon=100,
            forecast_horizon=50,
            update_frequency=1,
            retrain_frequency=7,
            reference_type=reference_type.Id,
        )

        # Verify the asset was created
        assert result is not None
        assert hasattr(result, "Id")
        assert result.Id == unique_id

    except Exception as e:
        pytest.fail(f"Asset creation with None inputs failed: {str(e)}")

    finally:
        # Cleanup: try to delete the test asset
        try:
            adh_client.Assets.deleteAsset(namespace_id, unique_id)
        except:
            pass  # Ignore cleanup errors


@pytest.mark.integration
def test_create_multiple_ml_types(adh_client, namespace_id):
    """Test that creating ML type multiple times works (getOrCreate behavior)."""
    # Create type first time
    type1 = create_ml_type()

    # Create type second time (should return existing)
    type2 = create_ml_type()

    # Both should be valid and have same ID
    assert type1 is not None
    assert type2 is not None
    assert type1.Id == type2.Id == "model_forecast"


@pytest.mark.integration
def test_ml_type_properties(adh_client, namespace_id):
    """Test that ML type has expected properties."""
    ml_type = create_ml_type()

    # Check basic properties
    assert ml_type.Id == "model_forecast"
    assert ml_type.Name == "model_forecast"
    assert ml_type.Description == "Data Model for Forecast"

    # Check that it has the expected number of properties
    assert hasattr(ml_type, "Properties")
    assert len(ml_type.Properties) == 5  # timestamp, forecast, lower, upper, weight

    # Check specific properties exist
    property_names = [prop.Id for prop in ml_type.Properties]
    expected_properties = ["Timestamp", "Forecast", "Lower", "Upper", "Weight"]

    for expected_prop in expected_properties:
        assert expected_prop in property_names, (
            f"Property {expected_prop} not found in type"
        )


@pytest.mark.unit
def test_model_constants():
    """Test that model constants are properly defined."""
    from app.model import (
        DEFAULT_MODEL_TYPE,
        ML_MODEL_ASSET_TYPE_QUERY,
        ML_MODEL_TYPE_DESCRIPTION,
        ML_MODEL_TYPE_ID,
        ML_MODEL_TYPE_NAME,
    )

    assert ML_MODEL_TYPE_ID == "model_forecast"
    assert ML_MODEL_TYPE_NAME == "model_forecast"
    assert ML_MODEL_TYPE_DESCRIPTION == "Data Model for Forecast"
    assert ML_MODEL_ASSET_TYPE_QUERY == "AssetTypeId:ml_model_id"
    assert DEFAULT_MODEL_TYPE == "LinearRegressionModel"

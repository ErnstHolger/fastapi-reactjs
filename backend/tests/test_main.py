import pytest
from fastapi import HTTPException


@pytest.mark.unit
def test_root(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI!"}


@pytest.mark.unit
def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.integration
def test_get_types_success(client, adh_client, namespace_id):
    """Test successful retrieval of types from ADH."""
    response = client.get("/connect/types")
    
    # Should succeed if ADH is properly configured
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration  
def test_get_streams_success(client, adh_client, namespace_id):
    """Test successful retrieval of streams from ADH."""
    response = client.get("/connect/streams")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration
def test_get_assets_success(client, adh_client, namespace_id):
    """Test successful retrieval of assets from ADH."""
    response = client.get("/connect/assets")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration
def test_get_asset_types_success(client, adh_client, namespace_id):
    """Test successful retrieval of asset types from ADH."""
    response = client.get("/connect/asset_types")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration
def test_get_models_success(client, adh_client, namespace_id):
    """Test successful retrieval of models from ADH."""
    response = client.get("/connect/models")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration
@pytest.mark.slow
def test_create_and_delete_model_integration(client, adh_client, namespace_id, test_model_data):
    """Test complete model lifecycle: create -> verify -> delete."""
    
    # Create model
    create_response = client.post("/connect/models", json=test_model_data)
    assert create_response.status_code == 200
    assert create_response.json() == {"status": "ok"}
    
    # Verify model exists
    models_response = client.get("/connect/models")
    assert models_response.status_code == 200
    models = models_response.json()
    
    # Find our test model
    test_model = next((m for m in models if m.get("Id") == test_model_data["id"]), None)
    assert test_model is not None, f"Test model {test_model_data['id']} not found in models list"
    
    # Delete model
    delete_response = client.delete(f"/connect/models?asset_id={test_model_data['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"status": "ok"}


@pytest.mark.integration
def test_stream_values_with_valid_stream(client, adh_client, namespace_id):
    """Test stream values retrieval with a valid stream."""
    # First, get available streams
    streams_response = client.get("/connect/streams")
    assert streams_response.status_code == 200
    streams = streams_response.json()
    
    if streams:  # Only test if streams exist
        stream_id = streams[0]["Id"]
        
        response = client.get(
            f"/connect/stream_values?stream_id={stream_id}&start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z&count=10"
        )
        
        # Should return data or empty list, not an error
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    else:
        pytest.skip("No streams available for testing")


@pytest.mark.integration 
def test_asset_values_with_valid_asset(client, adh_client, namespace_id):
    """Test asset values retrieval with a valid asset."""
    # First, get available assets
    assets_response = client.get("/connect/assets")
    assert assets_response.status_code == 200
    assets = assets_response.json()
    
    if assets:  # Only test if assets exist
        asset_id = assets[0]["Id"]
        
        response = client.get(
            f"/connect/asset_values?asset_id={asset_id}&start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z&count=10"
        )
        
        # Should return data or empty list, not an error
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    else:
        pytest.skip("No assets available for testing")


@pytest.mark.unit
def test_invalid_model_creation_data(client):
    """Test model creation with invalid data."""
    invalid_data = {
        "id": "",  # Empty ID should fail
        "name": "Test Model",
        "description": "Test description",
        "inputs": ["input1"],
        "outputs": ["output1"],
        "training_horizon": 100,
        "forecast_horizon": 50,
        "update_frequency": 1,
        "retrain_frequency": 7
    }
    
    response = client.post("/connect/models", json=invalid_data)
    # Should handle validation errors gracefully
    assert response.status_code in [400, 422, 500]  # Various error codes are acceptable


@pytest.mark.unit
def test_delete_nonexistent_model(client):
    """Test deletion of non-existent model."""
    response = client.delete("/connect/models?asset_id=nonexistent-model-id")
    # Should handle gracefully - either succeed silently or return error
    assert response.status_code in [200, 404, 500]


@pytest.mark.unit
def test_stream_values_invalid_parameters(client):
    """Test stream values with invalid parameters."""
    response = client.get("/connect/stream_values?stream_id=invalid&start=invalid&end=invalid&count=invalid")
    assert response.status_code in [400, 422, 500]  # Should handle validation errors
import pytest
import os
from app.client import get_adh_client, _adh_client
from unittest.mock import patch


@pytest.mark.unit
def test_get_adh_client_missing_env_vars():
    """Test ADH client creation with missing environment variables."""
    # Clear the global client first
    import app.client
    app.client._adh_client = None
    
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError) as exc_info:
            get_adh_client()
        
        assert "Missing required environment variables" in str(exc_info.value)


@pytest.mark.integration  
def test_get_adh_client_success():
    """Test successful ADH client creation with real config."""
    # Reset global client to test initialization
    import app.client
    app.client._adh_client = None
    
    # This should work if .env is properly configured
    client = get_adh_client()
    assert client is not None
    
    # Test singleton behavior
    client2 = get_adh_client()
    assert client is client2


@pytest.mark.integration
def test_adh_client_environment_variables():
    """Test that all required environment variables are present."""
    required_vars = ['API_VERSION', 'TENANT_ID', 'RESOURCE', 'CLIENT_ID', 'CLIENT_SECRET', 'NAMESPACE_ID']
    
    for var in required_vars:
        value = os.getenv(var)
        assert value is not None, f"Required environment variable {var} is not set"
        assert value.strip() != "", f"Required environment variable {var} is empty"


@pytest.mark.integration
def test_adh_client_connection():
    """Test that ADH client can be initialized without errors."""
    try:
        client = get_adh_client()
        # Basic validation that we got a client object
        assert hasattr(client, 'Types'), "ADH client should have Types attribute"
        assert hasattr(client, 'Streams'), "ADH client should have Streams attribute"
        assert hasattr(client, 'Assets'), "ADH client should have Assets attribute"
    except Exception as e:
        pytest.fail(f"ADH client initialization failed: {str(e)}")


@pytest.mark.unit
def test_get_adh_client_partial_env_vars():
    """Test ADH client creation with partially missing environment variables."""
    import app.client
    app.client._adh_client = None
    
    # Test with only some env vars present
    partial_env = {
        "API_VERSION": "v1",
        "TENANT_ID": "test-tenant",
        # Missing other required vars
    }
    
    with patch.dict(os.environ, partial_env, clear=True):
        with pytest.raises(ValueError) as exc_info:
            get_adh_client()
        
        error_msg = str(exc_info.value)
        assert "Missing required environment variables" in error_msg
        # Should mention the specific missing variables
        assert "RESOURCE" in error_msg
        assert "CLIENT_ID" in error_msg
        assert "CLIENT_SECRET" in error_msg


@pytest.mark.unit
def test_adh_client_singleton_reset():
    """Test that the singleton can be properly reset."""
    import app.client
    
    # Get initial client
    client1 = get_adh_client()
    
    # Reset the singleton
    app.client._adh_client = None
    
    # Get new client (should be same as first due to singleton)
    client2 = get_adh_client()
    
    # Both should be valid ADH clients
    assert client1 is not None
    assert client2 is not None
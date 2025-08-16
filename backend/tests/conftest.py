import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.client import get_adh_client
import os
from dotenv import load_dotenv

# Load environment variables for testing
load_dotenv()

@pytest.fixture
def client():
    """Test client fixture for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def adh_client():
    """Real ADH client for integration testing."""
    # Skip tests if required env vars are missing
    required_vars = ['API_VERSION', 'TENANT_ID', 'RESOURCE', 'CLIENT_ID', 'CLIENT_SECRET', 'NAMESPACE_ID']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        pytest.skip(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    try:
        return get_adh_client()
    except Exception as e:
        pytest.skip(f"Could not initialize ADH client: {str(e)}")


@pytest.fixture
def namespace_id():
    """Get namespace ID from environment."""
    return os.getenv('NAMESPACE_ID')


def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "slow: marks tests as slow running")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")


@pytest.fixture
def test_model_data():
    """Sample model data for testing."""
    return {
        "id": "pytest-test-model",
        "name": "PyTest Test Model",
        "description": "Test model created by pytest",
        "inputs": ["input1", "input2"],
        "outputs": ["output1"],
        "training_horizon": 100,
        "forecast_horizon": 50,
        "update_frequency": 1,
        "retrain_frequency": 7
    }


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_models():
    """Clean up any test models created during testing."""
    yield
    # Cleanup logic would go here if needed
    # For now, we'll leave test cleanup as a manual process
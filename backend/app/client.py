"""Shared ADH client configuration."""

import os
from typing import Optional

from adh_sample_library_preview import ADHClient
from dotenv import load_dotenv

# Load environment variables from the .env file in the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
# Environment variables with type hints
API_VERSION: Optional[str] = os.getenv("API_VERSION")
NAMESPACE_ID: Optional[str] = os.getenv("NAMESPACE_ID")
CLIENT_ID: Optional[str] = os.getenv("CLIENT_ID")
TENANT_ID: Optional[str] = os.getenv("TENANT_ID")
CLIENT_SECRET: Optional[str] = os.getenv("CLIENT_SECRET")
RESOURCE: Optional[str] = os.getenv("RESOURCE")

# Global client instance
_adh_client: Optional[ADHClient] = None


def get_adh_client() -> ADHClient:
    """Get or create ADH client singleton.
    
    Returns:
        ADHClient: Initialized ADH client instance
        
    Raises:
        ValueError: If required environment variables are missing
    """
    global _adh_client
    
    if _adh_client is not None:
        return _adh_client
    
    # Validate required environment variables
    required_vars = {
        "API_VERSION": API_VERSION,
        "TENANT_ID": TENANT_ID,
        "RESOURCE": RESOURCE,
        "CLIENT_ID": CLIENT_ID,
        "CLIENT_SECRET": CLIENT_SECRET,
        "NAMESPACE_ID": NAMESPACE_ID,
    }
    
    missing_vars = [name for name, value in required_vars.items() if not value]
    
    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            "Please check your .env file."
        )
    
    try:
        _adh_client = ADHClient(
            API_VERSION, TENANT_ID, RESOURCE, CLIENT_ID, CLIENT_SECRET, False
        )
    except Exception as e:
        raise RuntimeError(f"Failed to initialize ADH client: {str(e)}") from e
    
    return _adh_client

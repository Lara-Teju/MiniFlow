# integrations/services/base.py
import requests
from typing import Dict, Any

class BaseIntegration:
    def __init__(self, api_key: str, api_secret: str = None):
        self.api_key = api_key
        self.api_secret = api_secret
    
    def test_connection(self) -> Dict[str, Any]:
        raise NotImplementedError
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

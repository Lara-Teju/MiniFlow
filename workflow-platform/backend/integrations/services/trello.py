# integrations/services/trello.py
import requests
from .base import BaseIntegration
from typing import Dict, Any

class TrelloIntegration(BaseIntegration):
    BASE_URL = "https://api.trello.com/1"
    
    def _get_auth_params(self) -> Dict[str, str]:
        return {
            "key": self.api_key,
            "token": self.api_secret
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Trello API connection"""
        params = self._get_auth_params()
        response = requests.get(f"{self.BASE_URL}/members/me", params=params)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "username": data.get('username'),
                "fullName": data.get('fullName')
            }
        return {
            "success": False,
            "error": "Failed to connect to Trello"
        }
    
    def create_card(self, list_id: str, name: str, description: str = "") -> Dict[str, Any]:
        """Create a new card in Trello"""
        params = self._get_auth_params()
        params.update({
            "idList": list_id,
            "name": name,
            "desc": description
        })
        
        response = requests.post(f"{self.BASE_URL}/cards", params=params)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "card_id": data.get('id'),
                "url": data.get('url')
            }
        return {
            "success": False,
            "error": f"Failed to create card: {response.text}"
        }
    
    def move_card(self, card_id: str, list_id: str) -> Dict[str, Any]:
        """Move a card to a different list"""
        params = self._get_auth_params()
        params['idList'] = list_id
        
        response = requests.put(f"{self.BASE_URL}/cards/{card_id}", params=params)
        
        if response.status_code == 200:
            return {
                "success": True,
                "card_id": card_id
            }
        return {
            "success": False,
            "error": f"Failed to move card: {response.text}"
        }
    
    def list_boards(self) -> Dict[str, Any]:
        """List all boards"""
        params = self._get_auth_params()
        response = requests.get(f"{self.BASE_URL}/members/me/boards", params=params)
        
        if response.status_code == 200:
            return {
                "success": True,
                "boards": response.json()
            }
        return {
            "success": False,
            "error": "Failed to list boards"
        }
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if action == 'create_card':
            return self.create_card(
                params.get('list_id'),
                params.get('name'),
                params.get('description', '')
            )
        elif action == 'move_card':
            return self.move_card(
                params.get('card_id'),
                params.get('list_id')
            )
        elif action == 'list_boards':
            return self.list_boards()
        else:
            return {"success": False, "error": f"Unknown action: {action}"}
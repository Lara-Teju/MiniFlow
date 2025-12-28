# integrations/services/notion.py
import requests
from .base import BaseIntegration
from typing import Dict, Any

class NotionIntegration(BaseIntegration):
    BASE_URL = "https://api.notion.com/v1"
    NOTION_VERSION = "2022-06-28"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": self.NOTION_VERSION
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Notion API connection"""
        response = requests.get(
            f"{self.BASE_URL}/users/me",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "user": data.get('name'),
                "type": data.get('type')
            }
        return {
            "success": False,
            "error": "Failed to connect to Notion"
        }
    
    def create_page(self, database_id: str, title: str, content: str) -> Dict[str, Any]:
        """Create a new page in Notion database"""
        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Ticket": {
                    "title": [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                }
            },
            "children": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": content
                                }
                            }
                        ]
                    }
                }
            ]
        }
        
        response = requests.post(
            f"{self.BASE_URL}/pages",
            headers=self._get_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return {
                "success": True,
                "page_id": data.get('id'),
                "url": data.get('url')
            }
        return {
            "success": False,
            "error": f"Failed to create page: {response.text}"
        }
    
    def update_page(self, page_id: str, title: str, content: str = None) -> Dict[str, Any]:
        """Update an existing Notion page"""
        payload = {
            "properties": {
                "Ticket": {
                    "title": [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                }
            }
        }
        
        response = requests.patch(
            f"{self.BASE_URL}/pages/{page_id}",
            headers=self._get_headers(),
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "page_id": data.get('id')
            }
        return {
            "success": False,
            "error": f"Failed to update page: {response.text}"
        }
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if action == 'create_page':
            return self.create_page(
                params.get('database_id'),
                params.get('title'),
                params.get('content', '')
            )
        elif action == 'update_page':
            return self.update_page(
                params.get('page_id'),
                params.get('title'),
                params.get('content')
            )
        else:
            return {"success": False, "error": f"Unknown action: {action}"}

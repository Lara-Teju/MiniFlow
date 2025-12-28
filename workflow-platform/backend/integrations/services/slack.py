# integrations/services/slack.py
import requests
from .base import BaseIntegration
from typing import Dict, Any

class SlackIntegration(BaseIntegration):
    BASE_URL = "https://slack.com/api"
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Slack API connection"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.BASE_URL}/auth.test", headers=headers)
        data = response.json()
        
        if data.get('ok'):
            return {
                "success": True,
                "team": data.get('team'),
                "user": data.get('user')
            }
        return {
            "success": False,
            "error": data.get('error', 'Unknown error')
        }
    
    def send_message(self, channel_id: str, message: str) -> Dict[str, Any]:
        """Send a message to a Slack channel"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel_id,
            "text": message
        }
        
        response = requests.post(
            f"{self.BASE_URL}/chat.postMessage",
            headers=headers,
            json=payload
        )
        data = response.json()
        
        if data.get('ok'):
            return {
                "success": True,
                "message_ts": data.get('ts'),
                "channel": data.get('channel')
            }
        return {
            "success": False,
            "error": data.get('error', 'Failed to send message')
        }
    
    def list_channels(self) -> Dict[str, Any]:
        """List all channels"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.BASE_URL}/conversations.list", headers=headers)
        data = response.json()
        
        if data.get('ok'):
            return {
                "success": True,
                "channels": data.get('channels', [])
            }
        return {
            "success": False,
            "error": data.get('error', 'Failed to list channels')
        }
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if action == 'send_message':
            return self.send_message(
                params.get('channel_id'),
                params.get('message')
            )
        elif action == 'list_channels':
            return self.list_channels()
        else:
            return {"success": False, "error": f"Unknown action: {action}"}

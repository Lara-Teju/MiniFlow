# integrations/services/google_calendar.py
import requests
from .base import BaseIntegration
from typing import Dict, Any
from datetime import datetime

class GoogleCalendarIntegration(BaseIntegration):
    BASE_URL = "https://www.googleapis.com/calendar/v3"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Google Calendar API connection"""
        response = requests.get(
            f"{self.BASE_URL}/users/me/calendarList",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "calendars": len(response.json().get('items', []))
            }
        return {
            "success": False,
            "error": "Failed to connect to Google Calendar"
        }
    
    def create_event(
        self,
        calendar_id: str,
        summary: str,
        start_time: str,
        end_time: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """Create a calendar event"""
        payload = {
            "summary": summary,
            "description": description,
            "start": {
                "dateTime": start_time,
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_time,
                "timeZone": "UTC"
            }
        }
        
        response = requests.post(
            f"{self.BASE_URL}/calendars/{calendar_id}/events",
            headers=self._get_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return {
                "success": True,
                "event_id": data.get('id'),
                "link": data.get('htmlLink')
            }
        return {
            "success": False,
            "error": f"Failed to create event: {response.text}"
        }
    
    def list_events(self, calendar_id: str, max_results: int = 10) -> Dict[str, Any]:
        """List upcoming events"""
        params = {
            "maxResults": max_results,
            "timeMin": datetime.utcnow().isoformat() + 'Z',
            "singleEvents": True,
            "orderBy": "startTime"
        }
        
        response = requests.get(
            f"{self.BASE_URL}/calendars/{calendar_id}/events",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "events": data.get('items', [])
            }
        return {
            "success": False,
            "error": f"Failed to list events: {response.text}"
        }
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if action == 'create_event':
            return self.create_event(
                params.get('calendar_id', 'primary'),
                params.get('summary'),
                params.get('start_time'),
                params.get('end_time'),
                params.get('description', '')
            )
        elif action == 'list_events':
            return self.list_events(
                params.get('calendar_id', 'primary'),
                params.get('max_results', 10)
            )
        else:
            return {"success": False, "error": f"Unknown action: {action}"}
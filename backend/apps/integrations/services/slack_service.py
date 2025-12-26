"""
apps/integrations/services/slack_service.py
"""
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

class SlackService:
    def __init__(self, api_key):
        self.client = WebClient(token=api_key)
    
    def test_connection(self):
        """Verify bot token works"""
        try:
            response = self.client.auth_test()
            return True, f"Connected as {response['user']}"
        except SlackApiError as e:
            return False, str(e)
    
    def post_message(self, channel, text):
        """Post a message to a channel"""
        try:
            # Ensure channel starts with #
            if not channel.startswith('#'):
                channel = f"#{channel}"
            
            response = self.client.chat_postMessage(
                channel=channel,
                text=text
            )
            return {
                'success': True,
                'ts': response['ts'],
                'message': 'Message posted successfully'
            }
        except SlackApiError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_channels(self):
        """List available channels"""
        try:
            response = self.client.conversations_list(types="public_channel,private_channel")
            channels = [{'id': c['id'], 'name': c['name']} for c in response['channels']]
            return {'success': True, 'channels': channels}
        except SlackApiError as e:
            return {'success': False, 'error': str(e)}

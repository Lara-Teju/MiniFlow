
"""
apps/integrations/services/sendgrid_service.py
"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class SendGridService:
    def __init__(self, api_key, sender_email):
        self.client = SendGridAPIClient(api_key)
        self.sender_email = sender_email
    
    def test_connection(self):
        """Verify API key works"""
        try:
            # Make a simple API call to verify
            response = self.client.client.api_keys.get()
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)
    
    def send_email(self, to_email, subject, body):
        """Send an email"""
        try:
            message = Mail(
                from_email=self.sender_email,
                to_emails=to_email,
                subject=subject,
                html_content=body
            )
            response = self.client.send(message)
            return {
                'success': True,
                'status_code': response.status_code,
                'message': 'Email sent successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
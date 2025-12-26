"""
apps/workflows/executor.py
"""
import time
import random
from django.utils import timezone
from .models import WorkflowExecution
from apps.integrations.models import ConnectedApp
from apps.integrations.services.sendgrid_service import SendGridService
from apps.integrations.services.slack_service import SlackService
from apps.integrations.services.airtable_service import AirtableService

class WorkflowExecutor:
    
    def execute_workflow(self, workflow, test_mode=False, test_index=0):
        """Execute a single workflow"""
        start_time = time.time()
        execution = WorkflowExecution.objects.create(
            workflow=workflow,
            status='failed',  # Default to failed, update on success
            started_at=timezone.now()
        )
        
        try:
            # Step 1: Execute trigger
            trigger_data = self._execute_trigger(workflow, test_mode, test_index)
            execution.trigger_data = trigger_data
            
            # Step 2: Execute action
            action_result = self._execute_action(workflow, trigger_data, test_mode)
            execution.action_result = action_result
            
            # Determine status
            if action_result.get('success'):
                execution.status = 'success'
            else:
                execution.status = 'failed'
                execution.error_message = action_result.get('error', 'Unknown error')
                
        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.action_result = {'error': str(e)}
        
        # Calculate duration
        end_time = time.time()
        execution.duration_ms = int((end_time - start_time) * 1000)
        execution.completed_at = timezone.now()
        execution.save()
        
        return execution
    
    def _execute_trigger(self, workflow, test_mode, test_index):
        """Execute the trigger and get data"""
        if test_mode:
            # Generate test data
            return self._generate_test_trigger_data(workflow.trigger_app, test_index)
        
        # Get connected app
        try:
            app = ConnectedApp.objects.get(app_name=workflow.trigger_app, is_connected=True)
        except ConnectedApp.DoesNotExist:
            raise Exception(f"{workflow.trigger_app} is not connected")
        
        # Execute based on trigger type
        if workflow.trigger_app == 'airtable':
            service = AirtableService(app.api_key, app.additional_config.get('base_id'))
            table_name = workflow.trigger_config.get('table_name')
            result = service.get_records(table_name, max_records=1)
            if result['success'] and result['records']:
                return result['records'][0]
            else:
                raise Exception("No records found")
        
        return {}
    
    def _execute_action(self, workflow, trigger_data, test_mode):
        """Execute the workflow action"""
        if test_mode and random.random() < 0.15:  # 15% failure rate for realistic testing
            time.sleep(random.uniform(0.5, 2))  # Simulate network delay
            return {
                'success': False,
                'error': random.choice([
                    'Network timeout',
                    'Rate limit exceeded',
                    'Invalid API key',
                    'Service unavailable'
                ])
            }
        
        # Get connected app
        try:
            app = ConnectedApp.objects.get(app_name=workflow.action_app, is_connected=True)
        except ConnectedApp.DoesNotExist:
            return {'success': False, 'error': f"{workflow.action_app} is not connected"}
        
        # Add artificial delay for realism
        if test_mode:
            time.sleep(random.uniform(0.1, 1.5))
        
        # Execute action based on app type
        if workflow.action_app == 'sendgrid':
            service = SendGridService(app.api_key, app.additional_config.get('sender_email'))
            to_email = workflow.action_config.get('to_email') or trigger_data.get('fields', {}).get('Email', 'test@example.com')
            subject = workflow.action_config.get('subject', 'Workflow Notification')
            body = workflow.action_config.get('body', f"<p>New record: {trigger_data}</p>")
            return service.send_email(to_email, subject, body)
        
        elif workflow.action_app == 'slack':
            service = SlackService(app.api_key)
            channel = workflow.action_config.get('channel', 'general')
            message = workflow.action_config.get('message', f"New workflow trigger: {trigger_data}")
            return service.post_message(channel, message)
        
        elif workflow.action_app == 'airtable':
            service = AirtableService(app.api_key, app.additional_config.get('base_id'))
            table_name = workflow.action_config.get('table_name')
            fields = workflow.action_config.get('fields', {})
            return service.create_record(table_name, fields)
        
        return {'success': False, 'error': 'Unknown action type'}
    
    def _generate_test_trigger_data(self, trigger_app, index):
        """Generate realistic test data"""
        names = ['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Wilson', 'Eve Brown']
        emails = ['alice@example.com', 'bob@example.com', 'charlie@example.com', 'diana@example.com', 'eve@example.com']
        statuses = ['Active', 'Pending', 'Completed', 'On Hold']
        
        if trigger_app == 'airtable':
            return {
                'id': f'rec{index}{random.randint(1000, 9999)}',
                'fields': {
                    'Name': names[index % len(names)],
                    'Email': emails[index % len(emails)],
                    'Status': random.choice(statuses),
                    'CreatedAt': timezone.now().isoformat()
                }
            }
        
        return {'test': True, 'index': index}
# utils/executor.py
from integrations.models import Integration
from integrations.services.slack import SlackIntegration
from integrations.services.notion import NotionIntegration
from integrations.services.trello import TrelloIntegration
from integrations.services.google_calendar import GoogleCalendarIntegration
from runs.models import WorkflowRun, StepRun
from datetime import datetime
from typing import Dict, Any
import time

class WorkflowExecutor:
    SERVICE_MAP = {
        'slack': SlackIntegration,
        'notion': NotionIntegration,
        'trello': TrelloIntegration,
        'google_calendar': GoogleCalendarIntegration,
    }
    
    def __init__(self, workflow):
        self.workflow = workflow
    
    def execute(self, inputs: Dict[str, Any]) -> WorkflowRun:
        """Execute the workflow"""
        # Create run record
        run = WorkflowRun.objects.create(
            workflow=self.workflow,
            status='running',
            inputs=inputs
        )
        
        start_time = time.time()
        context = {'trigger': inputs}
        
        try:
            # Execute each step in order
            for step in self.workflow.steps.all():
                step_result = self._execute_step(run, step, context)
                
                if not step_result['success']:
                    # Step failed
                    run.status = 'failed'
                    run.error_message = step_result.get('error', 'Step execution failed')
                    break
                
                # Add step output to context for next steps
                context[f'step_{step.order}'] = step_result.get('data', {})
            else:
                # All steps succeeded
                run.status = 'success'
            
            # Update run duration
            end_time = time.time()
            run.duration_ms = int((end_time - start_time) * 1000)
            run.completed_at = datetime.now()
            run.save()
            
            # Update workflow stats
            self.workflow.total_runs += 1
            self.workflow.last_run = run.started_at
            self.workflow.save()
            
            return run
            
        except Exception as e:
            run.status = 'failed'
            run.error_message = str(e)
            run.duration_ms = int((time.time() - start_time) * 1000)
            run.completed_at = datetime.now()
            run.save()
            return run
    
    def _execute_step(
        self,
        run: WorkflowRun,
        step,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single workflow step"""
        step_run = StepRun.objects.create(
            run=run,
            step_name=step.get_action_type_display(),
            order=step.order,
            status='running',
            input_data=step.config
        )
        
        start_time = time.time()
        
        try:
            # Get integration
            integration = Integration.objects.get(
                app_type=step.app_id,
                linked=True
            )
            
            # Get service class
            service_class = self.SERVICE_MAP.get(step.app_id)
            if not service_class:
                raise ValueError(f"Unknown app: {step.app_id}")
            
            # Initialize service
            if step.app_id == 'trello':
                service = service_class(integration.api_key, integration.api_secret)
            else:
                service = service_class(integration.api_key)
            
            # Parse action from action_type
            action = step.action_type.split('_', 1)[1] if '_' in step.action_type else step.action_type
            
            # Replace template variables in config
            params = self._replace_variables(step.config, context)
            
            # Execute action
            result = service.execute_action(action, params)
            
            # Update step run
            step_run.status = 'success' if result.get('success') else 'failed'
            step_run.output_data = result
            step_run.duration_ms = int((time.time() - start_time) * 1000)
            step_run.completed_at = datetime.now()
            
            if not result.get('success'):
                step_run.error_message = result.get('error', 'Unknown error')
            
            step_run.save()
            
            return {
                'success': result.get('success', False),
                'data': result,
                'error': result.get('error')
            }
            
        except Exception as e:
            step_run.status = 'failed'
            step_run.error_message = str(e)
            step_run.duration_ms = int((time.time() - start_time) * 1000)
            step_run.completed_at = datetime.now()
            step_run.save()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def _replace_variables(self, config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Replace template variables like {{trigger.title}} with actual values"""
        result = {}
        for key, value in config.items():
            if isinstance(value, str) and '{{' in value:
                # Simple template replacement
                for ctx_key, ctx_value in context.items():
                    if isinstance(ctx_value, dict):
                        for sub_key, sub_value in ctx_value.items():
                            template = f"{{{{{ctx_key}.{sub_key}}}}}"
                            if template in value:
                                value = value.replace(template, str(sub_value))
            result[key] = value
        return result
"""
apps/integrations/services/airtable_service.py
"""
from pyairtable import Api

class AirtableService:
    def __init__(self, api_key, base_id):
        self.api = Api(api_key)
        self.base_id = base_id
    
    def test_connection(self):
        """Verify API key and base work"""
        try:
            base = self.api.base(self.base_id)
            tables = base.schema().tables
            return True, f"Connected to base with {len(tables)} tables"
        except Exception as e:
            return False, str(e)
    
    def get_tables(self):
        """List all tables in the base"""
        try:
            base = self.api.base(self.base_id)
            tables = base.schema().tables
            return {
                'success': True,
                'tables': [{'id': t.id, 'name': t.name} for t in tables]
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_records(self, table_name, max_records=10):
        """Fetch records from a table"""
        try:
            table = self.api.table(self.base_id, table_name)
            records = table.all(max_records=max_records)
            return {
                'success': True,
                'records': [{'id': r['id'], 'fields': r['fields']} for r in records]
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_record(self, table_name, fields):
        """Create a new record"""
        try:
            table = self.api.table(self.base_id, table_name)
            record = table.create(fields)
            return {
                'success': True,
                'record_id': record['id'],
                'fields': record['fields']
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
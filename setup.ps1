# Run in Administrator or Developer PowerShell
Set-StrictMode -Version Latest
$root = Join-Path (Get-Location) 'workflow-platform'
New-Item -ItemType Directory -Path $root -Force | Out-Null
Set-Location $root


Write-Host 'Creating directory tree...'
$backendPaths = @(
'backend/config',
'backend/apps/workflows',
'backend/apps/integrations/services',
'backend/apps/runs',
'backend/apps/analytics',
'backend/utils'
)
foreach ($p in $backendPaths) { New-Item -ItemType Directory -Path $p -Force | Out-Null }


$frontendPaths = @('frontend/src/lib','frontend/src/components/ui','frontend/src/components/layout','frontend/src/pages','frontend/public')
foreach ($p in $frontendPaths) { New-Item -ItemType Directory -Path $p -Force | Out-Null }


# Git init
if (-not (Test-Path .git)) { git init | Out-Null }


# Python venv
Set-Location (Join-Path $root 'backend')
python -m venv venv
# Activate venv for this session
$activate = Join-Path (Get-Location) 'venv/Scripts/Activate.ps1'
. $activate
pip install --upgrade pip
pip install django djangorestframework django-cors-headers celery redis requests python-dotenv
pip freeze > requirements.txt


# Start Django project and apps
django-admin startproject config .
python manage.py startapp workflows
python manage.py startapp integrations
python manage.py startapp runs
python manage.py startapp analytics
# Create .env.example
@"
SECRET_KEY=replace-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:5173
"@ | Out-File -FilePath .env.example -Encoding utf8


# Create utils/executor.py
New-Item -ItemType File -Path utils/executor.py -Force -Value @"
from time import time
def run_noop(workflow, payload):
start = time()
result = {'ok': True, 'message': 'noop'}
duration_ms = int((time() - start) * 1000)
return {
'status': 'success',
'result': result,
'duration_ms': duration_ms
}
"@ | Out-Null


# Frontend (use npm to create project)
Set-Location (Join-Path $root 'frontend')
npm create vite@latest . -- --template react-ts
npm install
npm install axios react-router-dom lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs
npm install sonner
npx tailwindcss init -p


Write-Host 'Windows setup finished. Run migrations and start servers as described.'
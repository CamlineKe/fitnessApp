# Create/update .gitignore files
Write-Host "Creating/updating .gitignore files..."
Set-Content -Path "frontend/.gitignore" -Value ".env" -Force
Set-Content -Path "backend/.gitignore" -Value ".env" -Force
Set-Content -Path "flask-ai/.gitignore" -Value ".env`n__pycache__/`n*.pyc" -Force

# Remove .env files from Git's tracking (if they exist)
Write-Host "Removing .env files from Git tracking..."
git rm --cached frontend/.env 2>$null
git rm --cached backend/.env 2>$null
git rm --cached flask-ai/.env 2>$null

# Add new .gitignore files
Write-Host "Adding new .gitignore files..."
git add frontend/.gitignore
git add backend/.gitignore
git add flask-ai/.gitignore

# Commit changes
Write-Host "Committing changes..."
git commit -m "Update .gitignore to exclude .env files in all directories"

Write-Host "Done! .env files will now be ignored in all directories." 
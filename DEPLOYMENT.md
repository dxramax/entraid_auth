# Azure Entra ID Login App - Deployment Guide

This Rust application provides Azure Entra ID authentication testing functionality.

## Application Details
- **Application ID**: ad09a2c4-7847-43d0-b0a2-15795df43203
- **Tenant Directory ID**: aad1209c-29cb-495b-8576-4ae795a8e989
- **Azure Website**: https://primegate-portal.azurewebsites.net/

## Features
- Azure Entra ID OAuth 2.0 authentication flow
- PKCE (Proof Key for Code Exchange) for security
- Simple test interface for login testing
- Session management
- Logout functionality

## Deployment Instructions

### Option 1: Manual Deployment via Azure Portal
1. Run `./deploy.sh` to build and prepare deployment files
2. Go to [Azure Portal](https://portal.azure.com)
3. Navigate to your App Service: `primegate-portal`
4. Go to **Deployment Center**
5. Choose **ZIP Deploy** option
6. Upload `primegate-portal-deploy.zip`

### Option 2: Azure CLI Deployment
```bash
# Build and prepare files
./deploy.sh

# Deploy using Azure CLI (replace <resource-group-name> with your actual resource group)
az webapp deployment source config-zip \
  --resource-group <resource-group-name> \
  --name primegate-portal \
  --src primegate-portal-deploy.zip
```

### Option 3: GitHub Actions (Automated)
The repository includes a GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) that can be configured with:
1. Your Azure publish profile in GitHub Secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`
2. Push to the `main` branch to trigger deployment

## Application Configuration

### Azure Entra ID Settings Required:
1. **Redirect URI**: `https://primegate-portal.azurewebsites.net/auth/callback`
2. **Supported account types**: Accounts in this organizational directory only
3. **Platform configuration**: Web application
4. **Token configuration**: Include OpenID Connect scopes (openid, profile, email)

### Application Routes:
- `/` - Home page with login test interface
- `/auth/login` - Initiates Azure login flow
- `/auth/callback` - OAuth callback handler
- `/auth/status` - Returns authentication status (JSON)
- `/auth/logout` - Logs out user and clears session

## Testing the Application

1. Navigate to https://primegate-portal.azurewebsites.net/
2. Click "Login with Azure" button
3. Complete Azure Entra ID authentication
4. Verify successful login status
5. Test logout functionality

## Environment Variables
- `PORT`: Application port (defaults to 8080, set by Azure automatically)

## Security Features
- PKCE flow for OAuth 2.0
- Secure session management
- HTTPS redirect enforced by Azure
- CSRF token validation (implemented in OAuth flow)
- Proper scope validation (openid, profile, email)

## Logs and Monitoring
- Application logs are available in Azure App Service logs
- Navigate to **Log stream** in Azure Portal for real-time logs
- Check **Diagnose and solve problems** for debugging issues
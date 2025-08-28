# Hybrid Rust + Node.js Azure Authentication Solution

## 🏗️ Architecture Overview

This solution combines the speed of Rust with the Azure compatibility of Node.js:

- **🦀 Rust Server (Main)**: Handles all application logic, business operations, and high-performance tasks
- **🟢 Node.js Auth Service**: Dedicated authentication service that handles Azure Entra ID OAuth flows
- **🔗 Communication**: HTTP API calls between Rust server and Node.js auth service

## 📦 Deployment Packages Created

1. **auth-service-deploy.zip** - Node.js authentication service
2. **rust-server-deploy.zip** - Rust main application server

## 🚀 Azure App Service Deployment

### Step 1: Deploy Node.js Authentication Service

1. Create a new Azure App Service for Node.js:
   ```bash
   az webapp create --resource-group primegate-portal-uk-rg \
     --plan primegate-portal-plan \
     --name primegate-auth-service \
     --runtime "NODE|20-lts"
   ```

2. Deploy the auth service:
   ```bash
   az webapp deploy --resource-group primegate-portal-uk-rg \
     --name primegate-auth-service \
     --src-path auth-service-deploy.zip --type zip
   ```

3. Configure environment variables:
   ```bash
   az webapp config appsettings set --resource-group primegate-portal-uk-rg \
     --name primegate-auth-service \
     --settings \
       BASE_URL="https://primegate-auth-service.azurewebsites.net" \
       RUST_SERVER_URL="https://primegate-portal.azurewebsites.net" \
       SESSION_SECRET="your-session-secret-here" \
       NODE_ENV="production"
   ```

### Step 2: Deploy Rust Main Server

1. Configure the existing App Service for custom startup:
   ```bash
   az webapp config set --resource-group primegate-portal-uk-rg \
     --name primegate-portal \
     --linux-fx-version "" \
     --startup-file "./login-app"
   ```

2. Set environment variables:
   ```bash
   az webapp config appsettings set --resource-group primegate-portal-uk-rg \
     --name primegate-portal \
     --settings \
       AUTH_SERVICE_URL="https://primegate-auth-service.azurewebsites.net"
   ```

3. Deploy the Rust server:
   ```bash
   az webapp deploy --resource-group primegate-portal-uk-rg \
     --name primegate-portal \
     --src-path rust-server-deploy.zip --type zip
   ```

## 🔧 Local Testing

### Start Auth Service (Terminal 1):
```bash
cd auth-service
npm install
BASE_URL="http://localhost:3001" RUST_SERVER_URL="http://localhost:8080" npm start
```

### Start Rust Server (Terminal 2):
```bash
AUTH_SERVICE_URL="http://localhost:3001" ./login-app
```

### Test the Flow:
1. Visit http://localhost:8080
2. Click "Login with Azure Entra ID"
3. Complete Microsoft authentication
4. Get redirected back with full user info

## 🔄 How It Works

1. **User visits Rust app** → Fast Rust server serves the main application
2. **Click Login** → Rust redirects to Node.js auth service
3. **Node.js handles OAuth** → Full Azure Entra ID authentication flow
4. **Authentication complete** → Node.js redirects back to Rust with session info
5. **Rust checks status** → HTTP API call to Node.js auth service
6. **User info cached** → Rust stores user data locally for performance
7. **Future requests** → Lightning-fast Rust with cached auth state

## 🚄 Performance Benefits

- **Rust Speed**: Main application logic runs at native speeds
- **Azure Compatibility**: Node.js handles complex OAuth flows perfectly
- **Session Caching**: Rust caches auth data to minimize Node.js calls
- **Fallback Mechanism**: Works even if auth service is temporarily unavailable
- **Best of Both**: Rust performance + Node.js Azure ecosystem

## 🛡️ Security Features

- **OAuth 2.0 + OpenID Connect**: Full Microsoft authentication
- **Session Management**: Secure session handling in Node.js
- **CSRF Protection**: Built into passport-azure-ad
- **API Communication**: Secured internal communication between services
- **Environment Isolation**: Auth credentials only in Node.js service

## ✅ Benefits of This Approach

1. **Azure App Service Compatible**: Node.js deploys perfectly to Azure
2. **Rust Performance**: Main app logic runs at maximum speed
3. **Separation of Concerns**: Auth isolated from business logic
4. **Scalable**: Can scale auth service independently
5. **Maintainable**: Clear separation between auth and app logic
6. **Future-Proof**: Easy to swap authentication providers

This hybrid approach gives you the best of both worlds: enterprise-grade authentication compatibility with high-performance application logic!
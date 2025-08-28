# 🔐 PrimeGate Auth Portal

A secure Azure Entra ID authentication portal built with Rust and deployed on Azure Container Apps.

## ✨ Features

- 🦀 **Pure Rust Implementation** - High-performance, memory-safe authentication service
- 🛡️ **Server-Side Authentication** - Secure OAuth2 flow with Azure Entra ID
- ⚡ **Container Apps Deployment** - Scalable cloud deployment on Azure
- 🔒 **Production Security** - Environment variables, HTTPS, and secure session management
- 📱 **Responsive UI** - Modern web interface with gradient design

## 🚀 Live Demo

**Working Portal:** https://primegate-auth-portal.delightfulfield-bccc7020.uksouth.azurecontainerapps.io/

Click "🔐 Sign In with Microsoft" to test the complete authentication flow.

## 🛠️ Technology Stack

- **Backend:** Rust with Actix Web framework
- **Authentication:** Azure Entra ID OAuth2 
- **Deployment:** Azure Container Apps
- **Container:** Multi-stage Docker build
- **Security:** Environment variables, HTTPS, JWT tokens

## 📋 Prerequisites

- Rust 1.75+ 
- Docker
- Azure CLI
- Azure Entra ID application registration

## 🏗️ Project Structure

```
├── src/main.rs              # Main Rust application
├── Cargo.toml               # Rust dependencies
├── Dockerfile               # Multi-stage container build
├── startup.sh               # Container startup script
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

```bash
CLIENT_ID=your-azure-ad-client-id
CLIENT_SECRET=your-azure-ad-client-secret
TENANT_ID=your-azure-ad-tenant-id
PORT=8080
RUST_LOG=info
```

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/dxramax/entraid_auth.git
   cd entraid_auth
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure AD credentials
   ```

3. **Run with Cargo**
   ```bash
   cargo run
   ```

4. **Or build with Docker**
   ```bash
   docker build -t primegate-auth-portal .
   docker run -p 8080:8080 --env-file .env primegate-auth-portal
   ```

## ☁️ Azure Deployment

### Container Apps Deployment

The application is deployed and running on Azure Container Apps with complete OAuth2 integration.

### Environment Configuration

The application automatically configures itself for Azure Container Apps with the correct redirect URIs and security settings.

## 🔐 Authentication Flow

1. User clicks "Sign In with Microsoft"
2. Redirect to Azure AD login (`/auth/login`)  
3. User authenticates with Microsoft
4. Azure AD redirects back to callback (`/auth/callback`)
5. Success page displays with user information

## 🧪 Testing

The live portal includes:
- ✅ Authentication status display
- ✅ Environment variable verification  
- ✅ Complete OAuth2 flow testing
- ✅ Callback handling and success confirmation

## 🔒 Security Features

- **Server-side OAuth2** - No client-side tokens
- **HTTPS enforcement** - Secure communication
- **Environment variables** - No hardcoded secrets
- **Session management** - Secure cookie handling
- **CSRF protection** - State parameter validation

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**🚀 Built with Rust • Deployed on Azure • Secured with Entra ID**
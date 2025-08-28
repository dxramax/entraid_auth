const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const app = express();
const PORT = process.env.PORT || 8080;

// Azure AD Configuration
const config = {
    identityMetadata: `https://login.microsoftonline.com/aad1209c-29cb-495b-8576-4ae795a8e989/v2.0/.well-known/openid_configuration`,
    clientID: 'ad09a2c4-7847-43d0-b0a2-15795df43203',
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: 'https://primegate-portal.azurewebsites.net/auth/openid/return',
    allowHttpForRedirectUrl: false,
    validateIssuer: false,
    isB2C: false,
    issuer: null,
    passReqToCallback: false,
    scope: ['profile', 'offline_access', 'https://graph.microsoft.com/User.Read'],
    loggingLevel: 'info',
    nonceLifetime: null,
    nonceMaxAmount: 5,
    useCookieInsteadOfSession: false,
    cookieEncryptionKeys: [
        { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
        { 'key': 'abcdefghijklmnopqrstuvwxyz123456', 'iv': 'abcdefghijkl' }
    ],
    clockSkew: null,
};

// Middleware
app.use(express.static('public'));
app.use(session({
    secret: 'azure-login-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true, // HTTPS required in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport strategy
passport.use(new OIDCStrategy(config, (iss, sub, profile, accessToken, refreshToken, done) => {
    console.log('Authentication successful for user:', profile.displayName);
    return done(null, {
        id: profile.oid,
        name: profile.displayName,
        email: profile.upn || profile.emails?.[0]?.value || 'unknown@example.com'
    });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Routes
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Azure Entra ID Authentication Test</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 600px; 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        .header {
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .badge {
            background: #0078d4;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        .button { 
            background: #0078d4; 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .button:hover { 
            background: #106ebe; 
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 110, 190, 0.3);
        }
        .user-info { 
            background: #e8f5e8; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #28a745;
        }
        .status {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .authenticated { 
            background: #d4edda; 
            color: #155724; 
            border-left: 4px solid #28a745;
        }
        .not-authenticated { 
            background: #f8d7da; 
            color: #721c24; 
            border-left: 4px solid #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Azure Entra ID Login</h1>
            <div class="badge">Production Ready Authentication</div>
        </div>
        
        ${req.user ? `
            <div class="status authenticated">
                <h2>✅ Authentication Successful!</h2>
                <div class="user-info">
                    <h3>Welcome, ${req.user.name}!</h3>
                    <p><strong>Email:</strong> ${req.user.email}</p>
                    <p><strong>ID:</strong> ${req.user.id}</p>
                </div>
                <a href="/logout" class="button">🚪 Logout</a>
            </div>
        ` : `
            <div class="status not-authenticated">
                <h2>👋 Ready to Login</h2>
                <p>Click the button below to authenticate with your Microsoft account.</p>
                <a href="/login" class="button">🔐 Login with Microsoft</a>
            </div>
        `}
        
        <div style="margin-top: 30px; color: #666; font-size: 14px;">
            <p><strong>Application ID:</strong> ad09a2c4-7847-43d0-b0a2-15795df43203</p>
            <p><strong>Tenant ID:</strong> aad1209c-29cb-495b-8576-4ae795a8e989</p>
        </div>
    </div>
</body>
</html>
    `;
    res.send(html);
});

// Login route
app.get('/login', passport.authenticate('azuread-openidconnect', { 
    failureRedirect: '/' 
}));

// Callback route
app.post('/auth/openid/return', 
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        console.log('Authentication callback successful');
        res.redirect('/');
    }
);

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

// API status endpoint
app.get('/auth/status', (req, res) => {
    if (req.user) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Azure Entra ID Login App',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Application error:', error);
    res.status(500).send('Something went wrong! Check the logs.');
});

app.listen(PORT, () => {
    console.log(`🚀 Azure Entra ID Login App running on port ${PORT}`);
    console.log(`🔗 URL: https://primegate-portal.azurewebsites.net/`);
    console.log(`🔐 Login: https://primegate-portal.azurewebsites.net/login`);
});
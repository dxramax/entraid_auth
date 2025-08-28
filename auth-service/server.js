const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Azure AD Configuration
const config = {
    identityMetadata: `https://login.microsoftonline.com/aad1209c-29cb-495b-8576-4ae795a8e989/v2.0/.well-known/openid_configuration`,
    clientID: 'ad09a2c4-7847-43d0-b0a2-15795df43203',
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/auth/callback`,
    allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
    clientSecret: process.env.CLIENT_SECRET || '', // Optional for public clients
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
app.use(cors({
    origin: process.env.RUST_SERVER_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'azure-auth-service-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
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
        email: profile.upn || profile.emails?.[0]?.value || 'unknown@example.com',
        accessToken: accessToken
    });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Azure Authentication Service' });
});

// Start authentication
app.get('/auth/login', passport.authenticate('azuread-openidconnect', { 
    failureRedirect: '/auth/error',
    customState: 'rust_app_auth',
    resourceURL: 'https://graph.microsoft.com/'
}));

// Authentication callback
app.post('/auth/callback', 
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/auth/error' }),
    (req, res) => {
        console.log('Authentication callback successful');
        // Redirect to Rust server with success indicator
        const rustServerUrl = process.env.RUST_SERVER_URL || 'http://localhost:8080';
        res.redirect(`${rustServerUrl}?auth=success&session=${req.sessionID}`);
    }
);

// Get authentication status (called by Rust server)
app.get('/auth/status/:sessionId?', (req, res) => {
    const sessionId = req.params.sessionId || req.sessionID;
    
    console.log('Auth status check for session:', sessionId);
    console.log('User authenticated:', !!req.user);
    
    if (req.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.json({ message: 'Logged out successfully' });
        });
    });
});

// Error handler
app.get('/auth/error', (req, res) => {
    res.status(400).json({ error: 'Authentication failed' });
});

// Generic error handler
app.use((error, req, res, next) => {
    console.error('Auth service error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🔐 Azure Authentication Service running on port ${PORT}`);
    console.log(`📝 Auth endpoint: http://localhost:${PORT}/auth/login`);
    console.log(`🔍 Status endpoint: http://localhost:${PORT}/auth/status`);
});
use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger, HttpRequest};
use actix_session::{Session, SessionMiddleware, storage::CookieSessionStore};
use actix_web::cookie::Key;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct UserInfo {
    id: String,
    name: String,
    email: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthResponse {
    authenticated: bool,
    user: Option<UserInfo>,
}

struct AppState {
    auth_service_url: String,
    http_client: Client,
}

async fn home(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    // Check if user came back from auth service
    let query_params: HashMap<String, String> = web::Query::<HashMap<String, String>>::from_query(req.query_string())
        .map(|q| q.into_inner())
        .unwrap_or_else(|_| HashMap::new());
    
    let auth_success = query_params.get("auth").map(|s| s == "success").unwrap_or(false);
    let session_id = query_params.get("session").cloned().unwrap_or_default();
    
    log::info!("Home page requested. Auth success: {}, Session ID: {}", auth_success, session_id);

    let html = r#"
<!DOCTYPE html>
<html>
<head>
    <title>Rust + Node.js Azure Entra ID Login</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .rust-badge { background: #ce422b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .nodejs-badge { background: #68a063; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .button { background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; transition: background 0.3s; }
        .button:hover { background: #106ebe; }
        .user-info { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0078d4; }
        .architecture { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status-indicator { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .not-authenticated { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 High-Performance Authentication</h1>
            <p><span class="rust-badge">RUST SERVER</span> + <span class="nodejs-badge">NODE.JS AUTH</span></p>
            <p>Fast Rust backend with Node.js handling Azure Entra ID authentication</p>
        </div>
        
        <div class="architecture">
            <h3>🏗️ Architecture</h3>
            <p><strong>Rust Server (Main):</strong> Handles all application logic, API endpoints, and business logic for maximum performance</p>
            <p><strong>Node.js Auth Service:</strong> Dedicated authentication service that communicates with Azure Entra ID</p>
            <p><strong>Communication:</strong> Rust server makes HTTP API calls to Node.js auth service</p>
        </div>

        <div id="status" class="status-indicator">
            <p>🔍 Checking authentication status...</p>
        </div>
        
        <div style="text-align: center;">
            <a href="/auth/login" class="button">🔐 Login with Azure Entra ID</a>
        </div>
    </div>

    <script>
        // Check authentication status
        fetch('/auth/status')
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('status');
                if (data.authenticated && data.user) {
                    statusDiv.className = 'status-indicator authenticated';
                    statusDiv.innerHTML = `
                        <div class="user-info">
                            <h3>✅ Authentication Successful!</h3>
                            <p><strong>Name:</strong> ${data.user.name}</p>
                            <p><strong>Email:</strong> ${data.user.email}</p>
                            <p><strong>ID:</strong> ${data.user.id}</p>
                            <a href="/auth/logout" class="button">🚪 Logout</a>
                        </div>
                    `;
                } else {
                    statusDiv.className = 'status-indicator not-authenticated';
                    statusDiv.innerHTML = '<p>❌ Not authenticated</p>';
                }
            })
            .catch(error => {
                console.error('Error checking auth status:', error);
                const statusDiv = document.getElementById('status');
                statusDiv.className = 'status-indicator not-authenticated';
                statusDiv.innerHTML = '<p>❌ Error checking authentication status</p>';
            });
    </script>
</body>
</html>
    "#;
    
    Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

async fn auth_login(data: web::Data<AppState>) -> Result<HttpResponse> {
    log::info!("Auth login requested, redirecting to Node.js auth service");
    let auth_url = format!("{}/auth/login", data.auth_service_url);
    log::info!("Redirecting to: {}", auth_url);
    
    Ok(HttpResponse::Found()
        .insert_header(("Location", auth_url))
        .finish())
}

async fn auth_status(data: web::Data<AppState>, session: Session) -> Result<HttpResponse> {
    log::info!("Checking authentication status with Node.js auth service");
    
    // Get session ID if available
    let session_id = session.get::<String>("session_id").unwrap_or(None);
    
    let status_url = if let Some(sid) = session_id {
        format!("{}/auth/status/{}", data.auth_service_url, sid)
    } else {
        format!("{}/auth/status", data.auth_service_url)
    };
    
    log::info!("Calling auth service: {}", status_url);
    
    match data.http_client.get(&status_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<AuthResponse>().await {
                    Ok(auth_response) => {
                        log::info!("Auth service response: authenticated={}", auth_response.authenticated);
                        if auth_response.authenticated {
                            // Store user info in Rust session for caching
                            if let Some(user) = &auth_response.user {
                                let _ = session.insert("user", user.clone());
                                let _ = session.insert("authenticated", true);
                                log::info!("User info cached in Rust session: {}", user.name);
                            }
                        }
                        Ok(HttpResponse::Ok().json(auth_response))
                    },
                    Err(e) => {
                        log::error!("Failed to parse auth service response: {}", e);
                        Ok(HttpResponse::Ok().json(AuthResponse { authenticated: false, user: None }))
                    }
                }
            } else {
                log::warn!("Auth service returned status: {}", response.status());
                Ok(HttpResponse::Ok().json(AuthResponse { authenticated: false, user: None }))
            }
        },
        Err(e) => {
            log::error!("Failed to contact auth service: {}", e);
            
            // Fallback to local session if auth service is unavailable
            if let Ok(Some(user)) = session.get::<UserInfo>("user") {
                if session.get::<bool>("authenticated").unwrap_or(None).unwrap_or(false) {
                    log::info!("Using cached session data");
                    return Ok(HttpResponse::Ok().json(AuthResponse {
                        authenticated: true,
                        user: Some(user)
                    }));
                }
            }
            
            Ok(HttpResponse::Ok().json(AuthResponse { authenticated: false, user: None }))
        }
    }
}

async fn auth_logout(data: web::Data<AppState>, session: Session) -> Result<HttpResponse> {
    log::info!("Logout requested");
    
    // Clear local session
    session.clear();
    
    // Call auth service logout
    let logout_url = format!("{}/auth/logout", data.auth_service_url);
    if let Err(e) = data.http_client.post(&logout_url).send().await {
        log::warn!("Failed to notify auth service of logout: {}", e);
    }
    
    log::info!("User logged out successfully");
    Ok(HttpResponse::Found()
        .insert_header(("Location", "/"))
        .finish())
}

// Health check endpoint for the Rust server
async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "OK",
        "service": "Rust Main Server",
        "version": "1.0.0"
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let auth_service_url = env::var("AUTH_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());
    
    log::info!("🚀 Starting Rust server on port {}", port);
    log::info!("🔗 Auth service URL: {}", auth_service_url);

    let secret_key = Key::generate();
    let http_client = Client::new();

    let app_state = web::Data::new(AppState {
        auth_service_url,
        http_client,
    });

    // Test connection to auth service
    let test_url = format!("{}/health", app_state.auth_service_url);
    match reqwest::get(&test_url).await {
        Ok(response) => {
            if response.status().is_success() {
                log::info!("✅ Successfully connected to auth service");
            } else {
                log::warn!("⚠️ Auth service responded with status: {}", response.status());
            }
        },
        Err(e) => {
            log::error!("❌ Failed to connect to auth service: {}", e);
            log::warn!("🔧 Make sure Node.js auth service is running on {}", app_state.auth_service_url);
        }
    }

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(Logger::default())
            .wrap(
                SessionMiddleware::new(
                    CookieSessionStore::default(),
                    secret_key.clone()
                )
            )
            .route("/", web::get().to(home))
            .route("/health", web::get().to(health))
            .route("/auth/login", web::get().to(auth_login))
            .route("/auth/status", web::get().to(auth_status))
            .route("/auth/logout", web::get().to(auth_logout))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
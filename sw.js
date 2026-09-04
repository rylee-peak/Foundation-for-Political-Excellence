self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[FPE SW] Installed successfully. Intercepting requests for OptiPlex backend.');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('[FPE SW] Activated and claimed clients.');
});

// =========================================================================
// CONFIGURATION
// Replace these with the actual domains pointing to your OptiPlex server.
// E.g., 'https://api.yourdomain.com' and 'https://auth.yourdomain.com'
// =========================================================================
const OPTIPLEX_BACKEND_URL = 'https://api.yourdomain.com'; // Update this when your API domain is ready
const OPTIPLEX_AUTHENTIK_URL = 'https://auth.rpeak.org';

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Proxy API requests to OptiPlex Backend API
    if (url.pathname.startsWith('/api/v1/')) {
        const targetUrl = OPTIPLEX_BACKEND_URL + url.pathname.replace('/api/v1', '');
        console.log('[FPE SW] Proxying API call to:', targetUrl);
        
        const newRequest = new Request(targetUrl, {
            method: event.request.method,
            headers: event.request.headers,
            body: event.request.body,
            mode: 'cors'
        });
        
        event.respondWith(fetch(newRequest).catch(err => {
            console.error('[FPE SW] API Proxy Error:', err);
            return new Response(JSON.stringify({ error: "Backend OptiPlex unreachable." }), { 
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }));
    }
    
    // Proxy Auth requests to Authentik IDP
    if (url.pathname.startsWith('/auth/')) {
        const targetUrl = OPTIPLEX_AUTHENTIK_URL + url.pathname;
        console.log('[FPE SW] Proxying Auth call to:', targetUrl);
        
        event.respondWith(fetch(targetUrl, { mode: 'cors' }).catch(err => {
            console.error('[FPE SW] Auth Proxy Error:', err);
            return new Response(JSON.stringify({ error: "Authentik IDP unreachable." }), { 
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }));
    }
});

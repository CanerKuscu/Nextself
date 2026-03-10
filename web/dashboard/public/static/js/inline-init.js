// Move inline initialization logic here to avoid inline scripts in HTML (CSP-safe)
document.addEventListener('DOMContentLoaded', function () {
    try {
        setTimeout(function () {
            document.body.classList.add('loaded');
            setTimeout(function () {
                var loadingFallback = document.getElementById('loading-fallback');
                if (loadingFallback) {
                    loadingFallback.style.display = 'none';
                }
            }, 300);
        }, 1000);
    } catch (e) {
        // Fail silently; don't break page loading
        console.error('inline-init failed', e);
    }
});

// Note: Service Worker registration intentionally omitted. Add a proper
// registration flow and external service-worker.js if PWA functionality is desired.

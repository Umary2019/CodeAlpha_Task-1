// Auth functionality is now integrated into app.js
// This file is kept for backward compatibility

console.log('Auth module loaded - functionality integrated into app.js');

// Redirect to login if not authenticated on protected pages
function requireAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    // Pages that require authentication
    const protectedPages = ['/cart.html', '/checkout.html'];
    
    if (protectedPages.some(page => currentPage.includes(page)) && !token) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
});
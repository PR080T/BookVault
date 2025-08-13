/**
 * Authentication Debugging Utility
 * 
 * This utility helps debug authentication issues by providing
 * detailed information about the current auth state.
 */

export const debugAuth = () => {
    console.group('🔍 Authentication Debug Info');
    
    try {
        // Check localStorage
        const authUserStr = localStorage.getItem('auth_user');
        console.log('📦 Raw localStorage auth_user:', authUserStr);
        
        if (authUserStr) {
            try {
                const authUser = JSON.parse(authUserStr);
                console.log('✅ Parsed auth_user object:', authUser);
                console.log('🔑 Has access_token:', !!authUser.access_token);
                console.log('🔄 Has refresh_token:', !!authUser.refresh_token);
                console.log('👤 User email:', authUser.email);
                console.log('🆔 User ID:', authUser.id);
                console.log('🎭 User role:', authUser.role);
                
                // Check token expiration if possible
                if (authUser.access_token) {
                    try {
                        const tokenParts = authUser.access_token.split('.');
                        if (tokenParts.length === 3) {
                            const payload = JSON.parse(atob(tokenParts[1]));
                            const now = Math.floor(Date.now() / 1000);
                            const isExpired = payload.exp < now;
                            console.log('⏰ Token expires at:', new Date(payload.exp * 1000));
                            console.log('⚠️ Token expired:', isExpired);
                        }
                    } catch (tokenError) {
                        console.warn('❌ Could not decode token:', tokenError);
                    }
                }
            } catch (parseError) {
                console.error('❌ Failed to parse auth_user:', parseError);
            }
        } else {
            console.log('❌ No auth_user found in localStorage');
        }
        
        // Check API endpoint configuration
        const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
        console.log('🌐 API Endpoint:', apiEndpoint);
        
        // Check current URL
        console.log('📍 Current URL:', window.location.href);
        console.log('🛣️ Current Path:', window.location.pathname);
        
    } catch (error) {
        console.error('❌ Error during auth debug:', error);
    }
    
    console.groupEnd();
};

export const clearAuthData = () => {
    console.log('🧹 Clearing all authentication data...');
    localStorage.removeItem('auth_user');
    console.log('✅ Authentication data cleared');
};

export const testAuthEndpoint = async () => {
    console.group('🧪 Testing Authentication Endpoint');
    
    try {
        const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5000';
        const testUrl = `${apiEndpoint}/health`;
        
        console.log('🎯 Testing endpoint:', testUrl);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Response data:', data);
        } else {
            console.log('❌ Response not OK');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
    
    console.groupEnd();
};

// Auto-run debug in development mode
if (import.meta.env.DEV) {
    window.debugAuth = debugAuth;
    window.clearAuthData = clearAuthData;
    window.testAuthEndpoint = testAuthEndpoint;
    console.log('🔧 Auth debug utilities available: debugAuth(), clearAuthData(), testAuthEndpoint()');
}
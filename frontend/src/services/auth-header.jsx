export default function authHeader() {  // Export for use in other modules
    // Try to get token from 'token' or 'auth_user' in localStorage
    let token = localStorage.getItem('token');
    if (!token) {
        const user = JSON.parse(localStorage.getItem('auth_user'));
        token = user && user.access_token ? user.access_token : null;
    }
    if (token) {
        return { Authorization: 'Bearer ' + token };
    } else {
        return {};
    }
}
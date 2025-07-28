export default function authHeader() {  // Export for use in other modules
    const user = JSON.parse(localStorage.getItem('auth_user'));

    if (user && user.access_token) {
        return { Authorization: 'Bearer ' + user.access_token };
    } else {
        return {};
    }
}
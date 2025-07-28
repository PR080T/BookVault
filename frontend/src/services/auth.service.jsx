import api, { apiWithRetry, checkConnection } from "./api";

const register = async (email, name, password) => {
    try {
  // Check server connection first
        const connectionStatus = await checkConnection();
        if (!connectionStatus.isConnected) {
            throw new Error(`Server unavailable: ${connectionStatus.message}`);
        }

        return await apiWithRetry.post("/v1/register", {
            email,
            name,
            password,
        });
    } catch (error) {
        if (error.isNetworkError) {
            throw new Error("Unable to connect to server. Please check your internet connection and try again.");
        }
        
  // Handle specific error cases
        if (error.response?.status === 422) {
            const message = error.response.data?.message || "Validation error";
            throw new Error(message);
        }
        
        if (error.response?.status === 409) {
            const message = error.response.data?.message || "Email already exists";
            throw new Error(message);
        }
        
        throw error;
    }
};

const login = async (email, password) => {
    try {
  // First check if server is reachable
        const connectionStatus = await checkConnection();
        if (!connectionStatus.isConnected) {
            throw new Error(`Server unavailable: ${connectionStatus.message}`);
        }

        const response = await apiWithRetry.post("/v1/login", {
            email,
            password,
        });

        if (response.data.access_token) {
            localStorage.setItem("auth_user", JSON.stringify(response.data));
        }

        return response.data;
    } catch (error) {
  // Enhanced error handling
        if (error.isNetworkError) {
            throw new Error("Unable to connect to server. Please check your internet connection and try again.");
        }
        throw error;
    }
};

const logout = async () => {
    try {
        const user = getCurrentUser();
        if (user && user.access_token) {
  // Send logout request to invalidate the token
            await api.post("/v1/token/logout/access", {});
        }
        
  // Also try to revoke refresh token if available
        if (user && user.refresh_token) {
            try {
                await api.post("/v1/token/logout/refresh", {}, {
                    headers: { Authorization: `Bearer ${user.refresh_token}` }
                });
            } catch (refreshError) {
                console.warn("Could not revoke refresh token:", refreshError);
            }
        }
    } catch (error) {
        console.error("Error during logout:", error);
  // Continue with logout even if API call fails
    } finally {
        localStorage.removeItem("auth_user");
    }
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("auth_user"));
};

const verify = (email, code) => {
    return api.post("/v1/verify", {
        email,
        code,
    });
};

const refreshToken = async () => {
    const user = getCurrentUser();
    if (!user || !user.refresh_token) {
        throw new Error("No refresh token available");
    }
    
    try {
        const response = await api.post("/v1/token/refresh", {}, {
            headers: { Authorization: `Bearer ${user.refresh_token}` }
        });
        
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        return updatedUser;
    } catch (error) {
  // If refresh fails, remove user data and redirect to login
        localStorage.removeItem("auth_user");
        throw error;
    }
};

export default {  // Export for use in other modules
    register,
    login,
    logout,
    getCurrentUser,
    verify,
    refreshToken,
};
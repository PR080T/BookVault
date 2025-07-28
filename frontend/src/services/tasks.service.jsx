import api from "./api";

/**
 * BookVault Tasks Service
 * Handles background task operations
 */

/**
 * Create a new background task
 * @param {Object} taskData - Task data containing type and data
 * @returns {Promise} API response
 */
const create = (taskData) => {
    return api.post("/v1/tasks", taskData);
};

/**
 * Get task status by ID
 * @param {string|number} id - Task ID
 * @returns {Promise} API response
 */
const getStatus = (id) => {
    return api.get(`/v1/tasks/${id}`);
};

/**
 * Retry a failed task
 * @param {string|number} id - Task ID
 * @returns {Promise} API response
 */
const retry = (id) => {
    return api.post(`/v1/tasks/${id}/retry`);
};

export default {  // Export for use in other modules
    create,
    getStatus,
    retry,
};
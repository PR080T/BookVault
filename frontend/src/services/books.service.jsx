import { apiWithRetry } from "./api";

/**
 * BookVault Books Service
 * Handles all book-related API operations
 */

/**
 * Add a new book to the library
 * @param {Object} data - Book data to add
 * @returns {Promise} API response
 */
const add = async (data) => {
    try {
        // Validate required fields
        if (!data.title || !data.title.trim()) {
            throw new Error('Book title is required');
        }
        
        if (!data.isbn || !data.isbn.trim()) {
            throw new Error('Book ISBN is required');
        }
        
        // Sanitize data
        const sanitizedData = {
            ...data,
            title: data.title.trim(),
            isbn: data.isbn.trim(),
            author: data.author ? data.author.trim() : '',
            description: data.description ? data.description.trim() : ''
        };
        
        return await apiWithRetry.post('/v1/books', sanitizedData);
    } catch (error) {
        console.error('Error adding book:', error);
        
        // Handle specific error cases
        if (error.response?.status === 409) {
            throw new Error(error.response.data?.message || 'Book already exists in your library');
        }
        
        if (error.response?.status === 422) {
            throw new Error(error.response.data?.message || 'Invalid book data');
        }
        
        throw error;
    }
};

/**
 * Get books from the library
 * @param {string} status - Filter by reading status (optional)
 * @param {number} page - Page number for pagination (optional)
 * @returns {Promise} API response with books data
 */
const get = async (status, page) => {
    try {
        const params = new URLSearchParams();
        if (status && status.trim()) params.append('status', status.trim());
        if (page && page > 0) params.append('offset', page.toString());
        
        const url = `/v1/books${params.toString() ? '?' + params.toString() : ''}`;
        return await apiWithRetry.get(url);
    } catch (error) {
        console.error('Error fetching books:', error);
        
        // Handle specific error cases
        if (error.response?.status === 400) {
            throw new Error(error.response.data?.message || 'Invalid request parameters');
        }
        
        if (error.response?.status === 401) {
            throw new Error('Authentication required. Please log in again.');
        }
        
        throw error;
    }
}

/**
 * Edit an existing book
 * @param {string|number} id - Book ID
 * @param {Object} data - Updated book data
 * @returns {Promise} API response
 */
const edit = async (id, data) => {
    try {
        const encodedId = encodeURIComponent(id);
        return await apiWithRetry.patch(`/v1/books/${encodedId}`, data);
    } catch (error) {
        console.error('Error editing book:', error);
        throw error;
    }
};

/**
 * Remove a book from the library
 * @param {string|number} id - Book ID
 * @returns {Promise} API response
 */
const remove = async (id) => {
    try {
        const encodedId = encodeURIComponent(id);
        return await apiWithRetry.delete(`/v1/books/${encodedId}`);
    } catch (error) {
        console.error('Error removing book:', error);
        throw error;
    }
};

/**
 * Get notes for a specific book
 * @param {string|number} id - Book ID
 * @returns {Promise} API response with notes data
 */
const notes = async (id) => {
    try {
        const encodedId = encodeURIComponent(id);
        return await apiWithRetry.get(`/v1/books/${encodedId}/notes`);
    } catch (error) {
        console.error('Error fetching book notes:', error);
        throw error;
    }
};

/**
 * Add a note to a specific book
 * @param {string|number} id - Book ID
 * @param {Object} data - Note data
 * @returns {Promise} API response
 */
const addNote = async (id, data) => {
    try {
        const encodedId = encodeURIComponent(id);
        return await apiWithRetry.post(`/v1/books/${encodedId}/notes`, data);
    } catch (error) {
        console.error('Error adding book note:', error);
        throw error;
    }
};

/**
 * Get book status by ISBN
 * @param {string} isbn - Book ISBN
 * @returns {Promise} API response with book status
 */
const status = async (isbn) => {
    try {
        const encodedIsbn = encodeURIComponent(isbn);
        return await apiWithRetry.get(`/v1/books/${encodedIsbn}`);
    } catch (error) {
        console.error('Error fetching book status:', error);
        throw error;
    }
}

/**
 * Get reading statistics
 * @returns {Promise} API response with reading statistics
 */
const getStats = async () => {
    try {
        return await apiWithRetry.get('/v1/books/stats');
    } catch (error) {
        console.error('Error fetching reading stats:', error);
        throw error;
    }
}

export default {
    add,
    get,
    edit,
    remove,
    notes,
    addNote,
    status,
    getStats,
};
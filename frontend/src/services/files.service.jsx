import { apiWithRetry } from "./api";

const get = (filename) => {
    return apiWithRetry.get("/v1/files/" + filename, { responseType: "blob" });
};

const getAll = () => {
    return apiWithRetry.get("/v1/files");
};

const upload = (formData) => {
    return apiWithRetry.post("/v1/files", formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
    });
};


export default {  // Export for use in other modules
    get,
    getAll,
    upload,
};
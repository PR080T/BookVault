import { apiWithRetry } from "./api";

const create = (data) => {
    return apiWithRetry.post("/v1/profiles", data);
};

const get_by_display_name = (display_name) => {
    const encodedDisplayName = encodeURIComponent(display_name);
    return apiWithRetry.get("/v1/profiles/" + encodedDisplayName);
}

const get = () => {
    return apiWithRetry.get("/v1/profiles");
};

const edit = (data) => {
    return apiWithRetry.patch("/v1/profiles", data);
}

export default {  // Export for use in other modules
    create,
    get,
    get_by_display_name,
    edit,
};
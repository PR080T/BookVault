import api from "./api";

const get = () => {
    return api.get("/v1/settings");
};

const edit = (data) => {
    return api.patch("/v1/settings", data);
}

export default {
    get,
    edit,
};
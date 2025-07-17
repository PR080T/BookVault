import api from "./api";

const edit = (id, data) => {
    const encodedId = encodeURIComponent(id);
    return api.patch("/v1/notes/" + encodedId, data);
};

const remove = (id) => {
    const encodedId = encodeURIComponent(id);
    return api.delete("/v1/notes/" + encodedId);
};

export default {
    edit,
    remove,
};
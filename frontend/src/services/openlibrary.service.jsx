import axios from "axios";  // HTTP client for API calls

const API_URL = "https:  // openlibrary.org";

const get = (id) => {
    const encodedId = encodeURIComponent(id);
    return axios.get(API_URL + "/search.json?isbn=" + encodedId + "&fields=key,title,author_name,number_of_pages_median,first_publish_year,cover_edition_key,isbn", { })  // API call to backend
};

const getWorks = (id) => {
    return axios.get(API_URL + id + ".json", { })  // API call to backend
}

export default {  // Export for use in other modules
    get,
    getWorks,
};
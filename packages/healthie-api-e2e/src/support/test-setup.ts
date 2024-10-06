/* eslint-disable */

import axios from 'axios';

module.exports = async function () {
    // Configure axios for tests to use.
    const host =
        process.env.HEALTHIE_API_ENDPOINT ??
        'http://localhost:8080/healthie-api/';
    axios.defaults.baseURL = host;
};

/* eslint-disable */

import axios from 'axios';

module.exports = async function () {
    // Configure axios for tests to use.
    const host =
        process.env.SUBSCRIPTION_API_ENDPOINT ??
        'http://localhost:8080/subscription-api/';
    axios.defaults.baseURL = host;
};

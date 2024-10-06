/* eslint-disable */

import axios from 'axios';
import {
    CognitoUserPool,
    AuthenticationDetails,
    CognitoUser,
} from 'amazon-cognito-identity-js';

const authenticateUser = (
    authenticationDetails: AuthenticationDetails,
    cognitoUser: CognitoUser,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                resolve(result.getIdToken().getJwtToken());
            },
            onFailure: function (err) {
                reject(err);
            },
        });
    });
};

module.exports = async function () {
    // Configure axios for tests to use.
    const host =
        process.env.GAME_API_ENDPOINT ?? 'http://localhost:8080/store-api/';
    axios.defaults.baseURL = host;

    const poolData = {
        UserPoolId: process.env.USER_POOL_ID,
        ClientId: process.env.USER_POOL_CLIENT_ID,
    };
    const userPool = new CognitoUserPool(poolData);

    const userCredentials = JSON.parse(process.env.USER_CREDENTIALS);

    const authenticationDetails = new AuthenticationDetails({
        Username: userCredentials['main-user-g6'],
        Password: userCredentials['password'],
    });

    const cognitoUser = new CognitoUser({
        Username: userCredentials['main-user-g6'],
        Pool: userPool,
    });

    const token = await authenticateUser(authenticationDetails, cognitoUser);
    axios.defaults.headers.common['Authorization'] = token;
};

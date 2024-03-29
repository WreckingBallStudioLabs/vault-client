"use strict";

//////
// Modules
//////

const request = require("../request");

//////
// Const and vars
//////

const username = process.env.VAULT_USERNAME;
const pwd = process.env.VAULT_PWD;

//////
// Exported functionality(ies)
//////

/**
 * login a user.
 * Note: User and service tokens need to have a very low TTL!
 *
 * @returns human token
 */
const login = () => {
	// Builds URL and make request
	let loginUserURL = `/auth/userpass/login/${username}`;

	const res = request.Do("POST", loginUserURL, {
		data: {
			"password": pwd
		}
	});

	if (!res.auth && !res.auth.client_token) throw new Error(`Failed to login user, empty response from Vault`);
	return res.auth.client_token;
};

module.exports = {
	login
};

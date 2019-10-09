"use strict";

//////
// Modules
//////

const request = require("../request");

//////
// Const and vars
//////

const appName = process.env.npm_package_name;
let token;

//////
// Validates env vars
//////

if (!appName) throw new Error("appRole auth strategy requires application name.");

//////
// Helpers
//////

/**
 * Get role id.
 *
 * @returns role id
 */
const appRoleIDGetRoleID = () => {
	// Builds URL and make request
	let getRoleIDURL = `/auth/approle/role/${appName}/role-id`;
	const res = request.Do("GET", getRoleIDURL, {
		token: token
	});

	if (!res.data && !res.data.role_id) throw new Error(`Failed to get role ID, or empty response from Vault.`);
	return res.data.role_id;
};

/**
 * Get secret id.
 *
 * @returns secret id
 */
const appRoleIDGetSecretID = () => {
	// Builds URL and make request
	let getRoleSecretIDURL = `/auth/approle/role/${appName}/secret-id`;
	const res = request.Do("POST", getRoleSecretIDURL, {
		token: token
	});

	if (!res.data && !res.data.secret_id) throw new Error(`Failed to get secret ID, or empty response from Vault.`);
	return res.data.secret_id;
};

/**
 * Get token.
 *
 * @returns application token
 */
const appRoleIDGetToken = () => {
	// Builds URL and make request
	let getTokenURL = `/auth/approle/login`;

	const res = request.Do("POST", getTokenURL, {
		token: token,
		data: {
			"role_id": appRoleIDGetRoleID(appName, token),
			"secret_id": appRoleIDGetSecretID(appName, token)
		}
	});

	if (!res.auth && !res.auth.client_token) throw new Error(`Failed to get token, or empty response from Vault.`);
	return res.auth.client_token;
};

//////
// Exported functionality(ies)
//////

/**
 * Login an app.
 *
 * @param {String} t the user, or any token with power to call `appRole`
 *
 * @returns token
 */
const login = (t) => {
	// Set token
	token = t;

	// Start login process
	return appRoleIDGetToken();
};

module.exports = {
	login
};

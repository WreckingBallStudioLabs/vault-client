"use strict";

//////
// Modules
//////

const request = require("./request");

//////
// Const and vars
//////

const environment = process.env.NODE_ENV;
const appName = process.env.npm_package_name;

//////
// Validates env vars
//////

if (!environment) throw new Error("Environment isn't defined.");
if (!appName) throw new Error("appRole auth strategy requires application name.");

//////
// Exported functionality(ies)
//////

/**
 * Get configurations.
 *
 * @param {String} token token to be used in the request
 * @param {String} version the version of the secret to be retrieved
 * @param {String} path the fully qualified path of the configurations
 *
 * @returns configurations
 */
const get = (token, version, path) => {
	// Builds URL
	let configurationURL = `/kv/data/services/${path}`;

	if (version) {
		configurationURL = `${configurationURL}?version=${version}`;
	}

	// Handles the request
	const res = request.Do("GET", configurationURL, {
		token: token
	});

	if (!res.data) throw new Error(`Vault config has no data, error: ${res}`);
	// Yep, `data` has `data`, lol
	if (!res.data.data) throw new Error(`Vault config has no data, error: ${res}`);

	return res.data.data;
};

/**
 * A convenient way to get the global configurations.
 *
 * @param {String} token token to be used in the request
 * @param {String} version the version of the secret to be retrieved
 *
 * @returns configurations
 */
const getGlobal = (token, version) => {
	return get(token, version, "global");
};

/**
 * A convenient way to get configurations using the package name.
 *
 * @param {String} token token to be used in the request
 * @param {String} version the version of the secret to be retrieved
 *
 * @returns configurations
 */
const getByPackageName = (token, version) => {
	let configurationsURL = `${appName}/${environment}`;
	return get(token, version, configurationsURL);
};

module.exports = {
	get,
	getGlobal,
	getByPackageName
};

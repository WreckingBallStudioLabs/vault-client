"use strict";

//////
// Modules
//////

const request = require("./request");

//////
// Const and vars
//////

const environment = process.env.NODE_ENV;

//////
// Exported functionality(ies)
//////

/**
 * Get configurations.
 *
 * @param {String} token token to be used in the request
 * @param {String} version the version of the configurations to be retrieved
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
 * @param {String} version the version of the configurations to be retrieved
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
 * @param {String} version the version of the configurations to be retrieved
 *
 * @returns configurations
 */
const getByPackageName = (token, appName, version) => {
	let configurationsURL = `${appName}/${environment}`;
	return get(token, version, configurationsURL);
};

/**
 * Validate if the loaded configuration contains all the required env vars
 *
 * @param {Array} requiredEnvVars a list of required env vars
 * @param {Object} configurations configurations
 */
const validate = (requiredEnvVars, configurations) => {
	const listOfNotFound = [];

	// Stores all keys that aren't found
	requiredEnvVars.forEach((key) => {
		if (!Object.keys(configurations).includes(key)) listOfNotFound.push(key);
	});

	if (listOfNotFound.length > 0) {
		// Breaks the application in case of any
		throw new Error(`Invalid config! Missing keys: ${listOfNotFound.join(', ')}`)
	}
};

module.exports = {
	get,
	getGlobal,
	getByPackageName,
	validate
};

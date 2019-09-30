/**
 * The intention of this package is to provide a lean Vault client
 */

"use strict";

const FS = require('fs');
const path = require('path');
const request = require('sync-request');

// Provides a way to define the name, if required
const secFilename = process.env.VAULT_CACHE_FILENAME || ".sec.json";
let token;

/**
 * Execute sync request
 *
 * @param verb HTTP verb
 * @param url  URL to request
 * @param data data to be sent
 *
 * @returns request
 */
const makeRequest = (verb, url, data) => {
	let params = {
		headers: {
			"Content-type": "application/json"
		},
	};
	// If token is specified, use that.
	if (token) {
		Object.assign(params, {
			headers: {
				"X-Vault-Token": token
			}
		});
	}
	// If data is specified (POST, PUT), use that.
	if (data) {
		Object.assign(params, {
			json: data
		});
	}
	// Make sync request. Yep, we want to block the app initialization
	let res;
	try {
		res = request(verb, url, params);
	} catch (error) {
		throw new Error(`Failed to call Vault, error: ${error.message}`);
	}
	// req.body is a buffer... `getBody` tries to convert to JSON
	try {
		return JSON.parse(res.getBody('utf8'));
	} catch (error) {
		throw new Error(`Failed to process Vault's request body, error: ${error}`);
	}
};

/**
 * Tries to load the cache from disk. The cache is encoded via Base64
 *
 * @returns Cached configuration
 */
const loadCache = () => {
	let configuration;
	try {
		const pathToSecret = path.resolve(secFilename);
		configuration = require(pathToSecret);
		configuration = Buffer.from(configuration.sec, "base64").toString("ascii");
		configuration = JSON.parse(configuration);
	} catch (error) {
		throw new Error("Failed to load cached configuration");
	}
	return configuration;
};

/**
 * Tries to cache configuration. Configuration will be encoded via Base64
 */
const createCache = (configuration) => {
	const configurationStringified = JSON.stringify(configuration);
	const configurationBase64 = Buffer.from(configurationStringified).toString("base64");
	try {
		FS.writeFileSync(path.resolve(secFilename), JSON.stringify({
			"sec": configurationBase64
		}));
	} catch (error) {
		throw new Error(`Failed to create cache! Error: ${error.message}`);
	}
};

/**
 * Automatically login user.
 * Note: User and service tokens need to have a very low TTL!
 *
 * @returns User token
 */
const loginUser = () => {
	// Builds URL and make request
	let loginUserURL = `${process.env.EDEX_VAULT_URL}/auth/userpass/login/${process.env.EDEX_VAULT_USERNAME}`;
	const res = makeRequest("POST", loginUserURL, {
		"password": process.env.EDEX_VAULT_PWD
	});
	if (!res.auth && !res.auth.client_token)
		throw new Error(`Failed to login user, empty response from Vault`);
	return res.auth.client_token;
};

/**
 * AppRole auth strategy: Get role id
 *
 * @returns role id
 */
const appRoleIDGetRoleID = () => {
	// Builds URL and make request
	let getRoleIDURL = `${process.env.EDEX_VAULT_URL}/auth/approle/role/${process.env.npm_package_name}/role-id`;
	const res = makeRequest("GET", getRoleIDURL);
	if (!res.data && !res.data.role_id)
		throw new Error(`Failed to get role ID, empty response from Vault`);
	return res.data.role_id;
};

/**
 * AppRole auth strategy: Get secret id
 *
 * @returns secret id
 */
const appRoleIDGetSecretID = () => {
	// Builds URL and make request
	let getRoleSecretIDURL = `${process.env.EDEX_VAULT_URL}/auth/approle/role/${process.env.npm_package_name}/secret-id`;
	const res = makeRequest("POST", getRoleSecretIDURL);
	if (!res.data && !res.data.secret_id)
		throw new Error(`Failed to get secret ID, empty response from Vault`);
	return res.data.secret_id;
};

/**
 * AppRole auth strategy: Get token
 *
 * @returns token
 */
const appRoleIDGetToken = () => {
	// Builds URL and make request
	let getTokenURL = `${process.env.EDEX_VAULT_URL}/auth/approle/login`;
	const res = makeRequest("POST", getTokenURL, {
		"role_id": appRoleIDGetRoleID(),
		"secret_id": appRoleIDGetSecretID()
	});
	if (!res.auth && !res.auth.client_token)
		throw new Error(`Failed to get token, empty response from Vault`);
	return res.auth.client_token;
};

/**
 * Get configuration
 *
 * @returns configuration
 */
const getConfiguration = () => {
	// Builds URL
	let configurationsURL = `${process.env.EDEX_VAULT_URL}/kv/data/${process.env.NODE_ENV}-${process.env.npm_package_name}`;
	const vaultSecretVersion = process.env.EDEX_VAULT_SECRETS_VERSION;
	if (vaultSecretVersion)
		configurationsURL = `${configurationsURL}?version=${vaultSecretVersion}`;
	const res = makeRequest("GET", configurationsURL);
	// Check if Vault's response has data, yep, also data has data (`data.data`)
	if (!res.data)
		throw new Error(`Vault config has no data, error: ${res}`);
	if (!res.data.data)
		throw new Error(`Vault config has no data, error: ${res}`);
	// Now we are talking, we did get a configuration
	return res.data.data;
};

/**
 * Load configurations into environment
 * @param configurations
 */
const loadConfigurations = (configurations) => {
	// Loads into environment
	Object.keys(configurations).forEach(configuration => {
		process.env[configuration] = configurations[configuration];
	});
};

module.exports = () => {
	try {
		// Automatically login user.
		token = loginUser();
		// The current default strategy is "AppRole" as recommended in the Vault
		// documentation for machine-to-machine authentication flow.
		token = appRoleIDGetToken();
		// Get and load configurations
		const configurations = getConfiguration();
		createCache(configurations);
		loadConfigurations(configurations);
	} catch (error) {
		// Cache should only work for development environment!
		if (process.env.NODE_ENV === "development") {
			// Banner
			console.log(`
///////////////
(╯°□°）╯︵ ┻━┻
WARNING: FAILED TO CONNECT TO VAULT @ ${process.env.EDEX_VAULT_URL}
FALLING BACK TO LOCAL CACHE, WHICH MAY BE OUT OF SYNC. GOOD LUCK!
///////////////
`);
			// Try to load configuration from cache
			const configurations = loadCache();
			loadConfigurations(configurations);
		}
	}
};

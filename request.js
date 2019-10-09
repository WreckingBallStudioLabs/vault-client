"use strict";

//////
// Modules
//////

const request = require("sync-request");

//////
// Const and vars
//////

const host = process.env.EDEX_VAULT_URL;

//////
// Validates env vars
//////

if (!host) throw new Error("Can't make request. Vault host isn't defined.");

//////
// Exported functionality(ies)
//////

/**
 * Executes a sync request.
 *
 * @param {String} verb HTTP verb.
 * @param {String} url  URL to request.
 * @param {Object} [settings] request settings.
 * @param {String} [settings.token] token to be used.
 * @param {Object} [settings.data] data to be sent.
 *
 * @returns request
 */
const Do = (verb, path, settings) => {
	settings = settings || {};

	// Default params.
	let params = {
		headers: {
			"Content-type": "application/json"
		}
	};

	// Calls like `login` for the `userpass` strategy is made without any token.
	// If a token is specified, use that.
	if (settings.token) {
		Object.assign(params, {
			headers: {
				"X-Vault-Token": settings.token
			}
		});
	}

	// If data is specified (POST, PUT), use that.
	if (settings.data) {
		Object.assign(params, {
			json: settings.data
		});
	}

	// Make sync request. Yep, we want to block the app initialization.
	let res;
	let body;

	try {
		const url = `${host}${path}`;

		res = request(verb, url, params);
		body = res.getBody("utf8");

		if (!/2\d\d/.test(res.statusCode)) throw new Error(`Failed to call Vault, error: ${body}`);
	} catch (error) {
		throw new Error(`Failed to call Vault, error: ${error.message}`);
	}

	// `req.body` is a buffer... `getBody` tries to convert to JSON
	try {
		body = JSON.parse(body);
		body.statusCode = res.statusCode;

		return body;
	} catch (error) {
		throw new Error(`Failed to process Vault's request body, error: ${error}`);
	}
};

/**
 * Check for the Vault server
 */
const ping = () => {
	Do("GET", "/sys/seal-status");
};

module.exports = {
	Do,
	ping
};

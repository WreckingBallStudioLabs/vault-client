/**
 * Vault client
 */

"use strict";

//////
// Modules
//////

const configuration = require("./configuration");
const cache = require("./cache");
const request = require("./request");

//////
// Const and vars
//////

const environment = process.env.NODE_ENV;

//////
// Validates env vars
//////

if (!environment) throw new Error("Environment isn't defined.");

//////
// Exported functionality(ies)
//////

module.exports = (settings) => {
	// Merges the default and user settings
	settings = Object.assign({
		// Secret version
		secretVersion: process.env.EDEX_VAULT_SECRETS_VERSION, // default to latest
		// Human auth strategy
		humanAuthStrategy: "userpass",
		// Machine to machine auth strategy
		m2mAuthStrategy: "appRole"
	}, settings);

	// If Vault server isn't there, tries to use cache
	try {
		request.ping()
	} catch (error) {
		// Cache should only work for development environment!
		if (process.env.NODE_ENV === "development") {
			// Notifies
			console.error(`
///////////////
(╯°□°）╯︵ ┻━┻
WARNING: FAILED TO CONNECT TO VAULT!
FALLING BACK TO LOCAL CACHE, WHICH MAY BE OUT OF SYNC.
GOOD LUCK!
///////////////
`);

			// Try to load configurations from cache
			const cachedConfigurations = cache.load();
			Object.assign(process.env, cachedConfigurations)

			return;
		}
	}

	let token;

	// Human login
	if (settings.humanAuthStrategy) {
		try {
			token = require(`./strategies/${settings.humanAuthStrategy}`).login();
		} catch (error) {
			throw new Error(`Faile to authenticate human, error: ${error.message}`);
		}
	}

	// Machine login
	if (settings.m2mAuthStrategy) {
		try {
			token = require(`./strategies/${settings.m2mAuthStrategy}`).login(token);
		} catch (error) {
			throw new Error(`Faile to authenticate human, error: ${error.message}`);
		}
	}

	let finalConfigurations = {};

	if (!settings.configurations) {
		// Retrieve configuration
		const globalConfigurations = configuration.getGlobal(token, settings.secretVersion);
		let specificConfigurations = {};

		try {
			specificConfigurations = configuration.getByPackageName(token, settings.secretVersion);
		} catch (error) {
			console.error("Warning! Could not found configurations for this app. Loaded just global configurations");
		}

		// Load into environment
		finalConfigurations = Object.assign(
			finalConfigurations,
			globalConfigurations,
			specificConfigurations
		);
	} else {
		settings.configurations.forEach(configPath => {
			Object.assign(
				finalConfigurations,
				configuration.get(
					token,
					settings.secretVersion,
					configPath
				)
			);
		});
	}

	// Load it
	Object.assign(process.env, finalConfigurations);

	// Cache it
	if (environment === "development") cache.create(finalConfigurations);
};

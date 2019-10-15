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

/**
 * Constructs a new Vault client
 *
 * @param {Object} [settings] custom settings
 * @param {Object} [settings.configurationVersion] version of the configuration to be retrieved
 * @param {Object} [settings.humanAuthStrategy]  human auth strategy
 * @param {Object} [settings.m2mAuthStrategy] machine auth strategy
 * @param {Object} [settings.configurations] a list of configurations to be retrieved
 * @param {Object} [settings.requiredEnvVars] a list of required keys
 */
module.exports = (settings) => {
	// Merges the default and user settings
	settings = Object.assign({
		// Configuration version
		configurationVersion: process.env.VAULT_CONFIGURATIONS_VERSION, // default to latest
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

	// Custom configurations
	if (!settings.configurations) {
		// Retrieve configuration
		const globalConfigurations = configuration.getGlobal(token, settings.configurationVersion);
		let specificConfigurations = {};

		try {
			specificConfigurations = configuration.getByPackageName(token, settings.configurationVersion);
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
					settings.configurationVersion,
					configPath
				)
			);
		});
	}

	// Configuration verification
	if (settings.requiredEnvVars) configuration.validate(settings.requiredEnvVars, finalConfigurations);

	// Load configuration and cache it
	Object.assign(process.env, finalConfigurations);
	if (environment === "development") cache.create(finalConfigurations);
};

/**
 * Vault client
 */

"use strict";

//////
// Modules
//////

const configuration = require("./configuration");
const request = require("./request");
const logger = require("./logger")("main");
const cache = require("./cache");

//////
// Const and vars
//////

const username = process.env.VAULT_USERNAME;
const environment = process.env.NODE_ENV;
const host = process.env.VAULT_URL;
const pwd = process.env.VAULT_PWD;

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
 * @param {Object} [settings.appName] application name
 * @param {Object} [settings.environments] the environments that Vault client should run
 * @param {Object} [settings.configurationVersion] version of the configuration to be retrieved
 * @param {Object} [settings.humanAuthStrategy]  human auth strategy
 * @param {Object} [settings.m2mAuthStrategy] machine auth strategy
 * @param {Object} [settings.configurations] a list of configurations to be retrieved
 * @param {Object} [settings.requiredEnvVars] a list of required keys
 */
module.exports = (settings) => {
	// Merges the default and user settings
	settings = Object.assign({
		environments: ["development", "production", "testing", "staging"],
		appName: process.env.npm_package_name,
		configurationVersion: process.env.VAULT_CONFIGURATIONS_VERSION, // default to latest
		humanAuthStrategy: "userpass",
		m2mAuthStrategy: "appRole"
	}, settings);

	logger.info(`"${process.env.NODE_ENV}" environment detected`);

	// Completly skip Vault client
	if (process.env.VAULT_CLIENT_SKIP) {
		logger.warn("Skipping...");
		return;
	}

	// Only run in the specified environments
	if (!settings.environments.includes(process.env.NODE_ENV)) {
		logger.warn(`"${process.env.NODE_ENV}" environment isn't in the allowed environments list. Skipping...`);
		return;
	}

	// Run once.
	if (process.env.VAULT_CLIENT_ALREADY_LOADED) {
		logger.warn("Vault client already loaded configurations and secrets. Skipping...");
		return;
	}

	// Validate settings
	if (!settings.appName) throw new Error(`"appName" need to be specified`);

	// Validates env vars
	if (!host) throw new Error("Can't make request. Vault host isn't defined.");
	if (!username) throw new Error("userpass auth strategy requires username.");
	if (!pwd) throw new Error("userpass auth strategy requires password.");

	// If Vault server isn't there, tries to use cache
	try {
		request.ping();
	} catch (error) {
		// Cache should only work for development environment!
		if (process.env.NODE_ENV === "development") {
			// Notifies
			logger.warn(`
///////////////
(╯°□°）╯︵ ┻━┻
WARNING: FAILED TO CONNECT TO VAULT!
FALLING BACK TO LOCAL CACHE, WHICH MAY BE OUT OF SYNC.
GOOD LUCK!
///////////////
`);

			// Try to load configurations from cache
			const cachedConfigurations = cache.load(settings.appName);
			Object.assign(process.env, cachedConfigurations);

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
			token = require(`./strategies/${settings.m2mAuthStrategy}`).login(token, settings.appName);
		} catch (error) {
			throw new Error(`Faile to authenticate human, error: ${error.message}`);
		}
	}

	let finalConfigurations = {};
	let loadedConfigurations = {};

	// Custom configurations
	if (!settings.configurations) {
		// Retrieve configuration
		const globalConfigurations = configuration.getGlobal(token, settings.configurationVersion);
		let specificConfigurations = {};

		// If there's no configuration, Vault throws an error. Here it's catch and handled properly.
		try {
			specificConfigurations = configuration.getByPackageName(token, settings.appName, settings.configurationVersion);
		} catch (error) {
			logger.warn("Warning! Could not found configurations for this app. Loaded just global configurations");
		}

		// Load into environment
		loadedConfigurations = Object.assign(
			loadedConfigurations, // target
			globalConfigurations, // source
			specificConfigurations // source
		);

		finalConfigurations = Object.assign(
			finalConfigurations, // target
			globalConfigurations, // source
			specificConfigurations, // source
			process.env // respect whatever is already exported
		);
	} else {
		settings.configurations.forEach(configPath => {
			loadedConfigurations = Object.assign(
				loadedConfigurations, // target
				configuration.get(
					token,
					settings.configurationVersion,
					configPath
				) // source
			);

			Object.assign(
				finalConfigurations, // target
				configuration.get(
					token,
					settings.configurationVersion,
					configPath
				), // source
				process.env // respect whatever is already exported
			);
		});
	}

	// Configuration verification
	if (settings.requiredEnvVars) configuration.validate(settings.requiredEnvVars, finalConfigurations);

	// Load configuration and cache it
	Object.assign(process.env, finalConfigurations);
	if (environment === "development") cache.create(settings.appName, finalConfigurations);

	// Notify
	logger.info(`Vault successfully loaded configurations for "${settings.appName}"`);

	// Debug feature: Only print in `development` env
	if (process.env.NODE_DEBUG && process.env.NODE_ENV === "development") {
		logger.info(
			'Debug mode enabled. Printing loaded env vars:',
			JSON.stringify(loadedConfigurations, null, 4)
		);
	}

	// Update control flag
	process.env.VAULT_CLIENT_ALREADY_LOADED = "true";
};

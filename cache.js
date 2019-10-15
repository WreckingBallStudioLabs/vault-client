"use strict";

//////
// Modules
//////

const FS = require("fs");
const path = require("path");

//////
// Const and vars
//////

const secFilename = process.env.VAULT_CACHE_FILENAME || ".sec.json";

//////
// Exported functionality(ies)
//////

/**
 * Tries to load the cache from disk. The cache is decoded with Base64.
 *
 * @returns Cached configurations
 */
const load = () => {
	let configurations;

	try {
		const pathToConfiguration = path.resolve(secFilename);
		configurations = require(pathToConfiguration);
		configurations = Buffer.from(configurations.sec, "base64").toString("ascii");
		configurations = JSON.parse(configurations);
	} catch (error) {
		throw new Error("Failed to load cached configurations");
	}
	return configurations;
};

/**
 * Tries to cache the configurations. The configurations will be encoded with Base64.
 *
 * @param {Object} configurations
 */
const create = (configurations) => {
	const configurationsStringified = JSON.stringify(configurations);
	const configurationsBase64 = Buffer.from(configurationsStringified).toString("base64");

	try {
		FS.writeFileSync(path.resolve(secFilename), JSON.stringify({
			"sec": configurationsBase64
		}));
	} catch (error) {
		throw new Error(`Failed to create cache! Error: ${error.message}`);
	}
};

module.exports = {
	load,
	create
};

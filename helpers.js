"use strict";

export {};

/**
 * It's'dangerous to use environment variables without checking that
 * they have been properly set. This is usually the task of the
 * configuration stack (package [code] + Vault + Consult).
 * While we don"t have this set up, the following code should help.
 *
 * @throws {CONFIGURATION_INVALID}
 */
const validateEnvVars = (requiredEnvVars) => {
	const listOfNotFound = [];

	// Stores all keys that aren't found
	requiredEnvVars.forEach((key) => {
		if (!Object.keys(process.env).includes(key)) listOfNotFound.push(key);
	});

	if (listOfNotFound.length > 0) {
		// Breaks the application in case of any
		`Failed to read content of directory: ${listOfNotFound}`
	}
};

module.exports = {
	validateEnvVars
};

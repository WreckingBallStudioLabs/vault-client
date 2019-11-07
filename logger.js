"use strict";

//////
// Modules
//////

const pino = require('pino')

//////
// Exported functionality(ies)
//////

/**
 * Creates a scoped logger
 *
 * @param {String} name logger name
 *
 * @returns Named logger
 */
const scopedLogger = (name) => {
	return pino({
		name: `Vault Client::${name}`,
		prettyPrint: {
			colorize: true,
			timestampKey: '',
			ignore: 'pid,hostname'
		}
	});
};

module.exports = scopedLogger;

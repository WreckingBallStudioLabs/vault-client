// TODO: Use JEST

//////
// Modules
//////

const assert = require('assert').strict;

//////
// Const and vars
//////

const assertions = () => {
	// From Global
	assert.strictEqual(process.env.BROKER_HOST, "amqp://localhost:32551");

	// Overwritten by app configuration
	assert.strictEqual(process.env.VERSION, "v2");

	// From App configuration
	assert.strictEqual(process.env.A, "1");
};

//////
// Starts here
//////

// Prepare test
process.env.npm_package_name = "vault-client";
process.env.NODE_ENV = "testing"

// Normal scenario
require("./index")();
assertions();

// Specifying configurations scenario
require("./index")({
	configurations: ["global", "vault-client/testing"]
});
assertions();

// Loading from cache scenario
process.env.EDEX_VAULT_URL = "blablabla";
require("./index")();
assertions();

// Should only loads global
process.env.npm_package_name = "service-without-configurations";

require("./index")();

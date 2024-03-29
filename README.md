[![nodejs version status](https://img.shields.io/badge/NodeJS-8.x.x-green.svg?style=flat-square)]()

# Vault client

<p align="justify">A Vault client that makes easier to work with configurations and secrets.</p>

## Table of Contents

  1. [Requirements](#requirements)
  2. [Usage](#usage)
  3. [Distribution](#distribution)

## Requirements

The Vault client assumes that you have a reachable and set up Vault server. The following environment variables are **required**:

- `VAULT_URL`: Vault host.
- `VAULT_USERNAME`: Vault user username provided by an admin/operator.
- `VAULT_PWD`: Vault user password provided by an admin/operator.
- `NODE_ENV`: Specifies what type of environment it's running.

The following are optional:

- `VAULT_CONFIGURATIONS_VERSION`: Specifies the version of the configuration to be retrieved.
- `VAULT_CACHE_FILENAME`: The cache filename.

## How it works

Each time an application runs, the Vault client will automatically log in the developer and application. Configurations can be accessed via `process.env`.

## Usage

Require the package as soon as possible, if possible, the first line of the application entry point file. Examples of usage:

```
// Vault client will load the global and app-specific configurations. It will infer from the package name and the type of the environment.
require("@wrecking-ball-software/vault-client")();
```

```
// Specifies configurations to be loaded
require("@wrecking-ball-software/vault-client")({
	configurations: ["global", "vault-client/testing"]
});
```

```
// Specifies allowed environments to run
require("@wrecking-ball-software/vault-client")({
	// Only run if NODE_ENV === `development`
  environments: ['development']
});
```

```
// Specifies required environments variables
require("@wrecking-ball-software/vault-client")({
  requiredEnvVars: ['XYZ', 'ASD']
});
```

## Behaviors

Vault behavior can be controlled via environment variables.

- `VAULT_CLIENT_SKIP`: If specified, skips running the Vault client.
- `VAULT_CLIENT_ALREADY_LOADED`: Automatically set by Vault, when set, also skips running.

## Distribution

- Via [NPM](https://www.npmjs.com/package/@wrecking-ball-software/vault-client): `$ npm i @wrecking-ball-software/vault-client`

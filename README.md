[![nodejs version status](https://img.shields.io/badge/NodeJS-8.x.x-green.svg?style=flat-square)]()

# Vault client

<p align="justify">This is a Vault client that makes working with configurations and secrets easier.</p>

## Table of Contents

  1. [Requirements](#requirements)
  2. [Usage](#usage)
  3. [Distribution](#distribution)

## Requirements

The Vault client assumer that you have Vault server.

## How it works

The Vault client automatically logs in for the user and for each service. If running in the `development` environment, it will not only load the configurations in-memory, but it will also caches it.

## Usage

- Require the package, in the first line of the application entrypoint.

## Distribution

- Via [NPM](https://www.npmjs.com/package/@wrecking-ball-software/vault-client)

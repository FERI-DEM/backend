## Description

Main project backend.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Running the with docker

```bash
 docker build -t watt4cast .
 docker run -p 3001:3001 --env-file .env.development watt4cast 
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Example env

```bash
NODE_ENV=development
PORT=3000
URL_PREFIX=/modules
DB_URI=mongodb://root:root@localhost:27017
WEATHER_API_KEY=weather_api_key
SENTRY_DSN=dns
SENTRY_ENABLED=false
SOLCAST_API_KEY=abc

# firebase service account
FIREBASE_SERVICE_ACCOUNT=service_account
FIREBASE_PROJECT_ID=solarcast-123
FIREBASE__PRIVATE_KEY_ID=123
FIREBASE_PRIVATE_KEY={"privateKey": "-----BEGIN PRIVATE KEY-----\abcdef\n-----END PRIVATE KEY-----\n"}
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@solarcast.com
FIREBASE_CLIENT_ID=123
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.google

# casandra
CASSANDRA_CLIENT_ID=test
CASSANDRA_CLIENT_SECRET=test
CASSANDRA_KEYSPACE=w4c
CASSANDRA_PATH_TO_BUNDLE=./secure-connect-watt4cast-historical.zip
```

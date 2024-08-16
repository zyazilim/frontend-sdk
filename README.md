# Monkedo Frontend SDK

This is the official Monkedo Frontend SDK. It is a JavaScript library that allows you to interact with the Monkedo IPaaS API from a web browser or Node.js.

## Installation

You can install the Monkedo Frontend SDK via npm:

```bash
npm install monkedo-frontend-sdk
```

or via pnpm:

```bash
pnpm install monkedo-frontend-sdk
```

## Usage

To use the Monkedo Frontend SDK, you need to create an instance of the `Monkedo` class and provide `your-project-id`:

```typescript
import { Monkedo } from 'monkedo-frontend-sdk'

const monkedo = new Monkedo('your-project-id');

// Connect App
monkedo.connectApp({
	appKey,
	userId,
}).then(() => {
	console.log('Connected to the app');
}).catch((error) => {
	console.error('Failed to connect to the app', error);
});

// Get App Credential Informations
monkedo.getAppCredentialInfo(appKey).then((appCredentialInfo) => {
	console.log('App Credential Info:', appCredentialInfo);
}).catch((error) => {
	console.error('Failed to get app credential info', error);
});
```

## Local Development

To run the library locally, you can use the following commands:

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Link the library
npm link path/to/monkedo-frontend-sdk

# Install the library in your project
npm link monkedo-frontend-sdk
```

Then, you can use the library in your project.

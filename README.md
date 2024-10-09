# Monkedo Frontend SDK

This is the official Monkedo Frontend SDK. It is a JavaScript library that allows you to interact with the Monkedo IPaaS API from a web browser or Node.js.

## Installation

You can install the Monkedo Frontend SDK via npm:

```bash
npm install @monkedo/frontend-sdk
```

or via pnpm:

```bash
pnpm install @monkedo/frontend-sdk
```

## Usage

To use the Monkedo Frontend SDK, you need to create an instance of the `Monkedo` class and provide `your-project-id`:

```typescript
import { Monkedo } from '@monkedo/frontend-sdk'

const monkedo = new Monkedo('your-project-id', 'your-app-name');

/**
 * Connect an app to the Monkedo IPaaS platform.
 * 
 * @param appKey The integration app key.
 * @param userId The user ID.
 * @returns The result of the connection. 3 possible values:
 * - "CONNECTION_SUCCESS": The app was successfully connected.
 * - "CONNECTION_FAILED": The app connection failed.
 * - "POPUP_BLOCKED": The popup was blocked by the browser.
 */
const result = await monkedo.connectApp({ appKey, userId });

/**
 * Get the app credential info and open the connection form.
 * 
 * @param appKey The integration app key.
 * @returns The result of the connection. 3 possible values:
 * - "CONNECTION_SUCCESS": The app was successfully connected.
 * - "CONNECTION_FAILED": The app connection failed.
 */
const credentialInfo = await monkedo.getAppCredentialInfo(appKey);

/**
 * Check if the user has connected to the specified integration apps.
 * 
 * @param userId The user ID.
 * @param appKeys The integration app keys. Split by comma.
 * @returns The result of the check. { [appKey: string]: "connected" | "not-connected" | "invalid" }
 */
const result = await monkedo.checkUserConnections(userId, appKeys);
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

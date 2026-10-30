# ResourceBridge

ResourceBridge is a community resource-sharing application for discovering and listing resources, coordinating bookings, connecting organizations, and requesting customer support.

## Repository contents

This repository includes the ResourceBridge web app, its API server, and the workspace libraries and database schemas needed by those services.

## Run locally

Install the workspace dependencies, then start the API server and web app in separate terminals:

```sh
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/resourcebridge run dev
```

Configure required environment values through your hosting provider's secret manager. Do not commit credentials or local environment files.

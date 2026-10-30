# ResourceBridge

> Connecting resources. Empowering people.

ResourceBridge is a community resource-sharing platform for campuses, laboratories, community organizations, and small businesses. It helps people find underused spaces, equipment, and services, request access, coordinate bookings, and return resources responsibly.

## What the platform does

### Discover and share resources

- Browse resources by category, search and inspect listing details, and view available photos.
- Create and edit listings with descriptions, location, organization, capacity, access requirements, and other practical details.
- Organize resources into 12 categories: Spaces; Electronic Gadgets; Tools & Equipment; Technical Services; Learning Materials; Sports & Recreation; Events & Community; Mobility & Transport; Home & Daily Living; Creative & Media; Kitchen & Catering; and Other Resources.
- Link resources to organizations where permitted, while keeping independent listings available.

### Request and manage bookings

- Customers can request access to a resource and follow its booking status.
- Owners can review incoming requests, approve or decline them, and provide a note to the requester.
- Booking workflows include scheduling, access information, check-in, return reporting, and owner confirmation where applicable.
- Overview and booking pages help each role see the information relevant to its work.

### Build trusted organizations and accounts

- Organization workspaces support membership, resource ownership, and verification/review workflows.
- Owners and customers can exchange ratings after eligible bookings, helping people make informed decisions.
- Profile and verification tools help people manage their account details and workspace access.

### Customer care and Jarvis

- Customers and owners can raise support tickets; authorized customer-care staff can work through the shared queue, reply, and resolve cases.
- Jarvis provides role-aware ResourceBridge guidance. Its support tools include multilingual translation and optional voice interaction, depending on configured services and device support.
- Customer-care staff can use Jarvis for translation and non-clinical supportive listening. Jarvis is not a human support agent or a licensed clinician and does not diagnose or prescribe.
- AI responses can be incorrect. Verify important information and use the app’s actual workflows to submit requests or make account changes.

## Roles

- **Customer:** explores listings, requests bookings, tracks visits and returns, rates owners, and contacts customer care.
- **Owner:** lists resources, manages photos and details, reviews requests, coordinates bookings and returns, rates customers, and contacts customer care.
- **Customer-care agent:** works with support tickets and uses the care-focused Jarvis tools available to that role.
- **Organization administrators and reviewers:** manage organization membership and verification workflows according to their assigned permissions.

The interface and API enforce role-specific access. A role written in a chat message does not grant permissions.

## Privacy and responsible use

- Account-aware Jarvis assistance is opt-in. Only the account context permitted for that chat should be shared with the assistant.
- Do not send passwords, authentication codes, payment information, or other secrets to the assistant or include them in support messages.
- Customer-care translation works from text supplied by the agent; the assistant does not automatically receive support tickets or account records.
- Development sample resources are synthetic and are not production listings. Never use sample credentials for real services or accounts.
- Keep secrets in Replit Secrets or another hosting provider’s secret manager. Never commit .env files, API keys, tokens, private keys, or real passwords.

## Technology

- **Web:** React, TypeScript, Vite, TanStack Query, Wouter, Tailwind CSS, and Radix UI.
- **API:** Node.js and Express, with shared request/response schemas and generated React API hooks.
- **Data:** PostgreSQL with Drizzle ORM.
- **Authentication:** Clerk.
- **AI:** Replit AI Integrations for supported Jarvis text and voice features.
- **Photos and files:** object storage configured by the hosting environment.

## Repository layout

- **artifacts/resourcebridge/** — ResourceBridge web application and static assets.
- **artifacts/api-server/** — API server, ResourceBridge endpoints, and supporting services.
- **lib/api-spec/** — shared API specification.
- **lib/api-zod/** — shared validation schemas and API types.
- **lib/api-client-react/** — generated React API client and query hooks.
- **lib/db/** — database connection, Drizzle schema, and development database commands.
- **lib/integrations-openai-ai-server/** — server-side AI integration helpers.

This repository contains ResourceBridge and the shared packages it needs. It does not include the other applications from the original multi-artifact workspace.

## Run the project

### Requirements

- Node.js 24
- pnpm
- PostgreSQL for persistent application data
- Clerk configuration for authentication
- Replit AI Integration configuration for Jarvis AI features

### Install dependencies

```sh
git clone https://github.com/GontuSujithReddy/resourcebridge.git
cd resourcebridge
pnpm install
```

### Configure environment values

Set environment variables through Replit Secrets or your hosting provider’s secret manager. The exact set depends on which services you enable.

| Variable | Used for |
| --- | --- |
| DATABASE_URL | PostgreSQL connection for the API and database package. |
| CLERK_SECRET_KEY | Server-side Clerk authentication. |
| CLERK_PUBLISHABLE_KEY | Clerk configuration used by the API server. |
| VITE_CLERK_PUBLISHABLE_KEY | Clerk configuration used by the web app. |
| SESSION_SECRET | Signing server-side session and verification flows that require it. |
| AI_INTEGRATIONS_OPENAI_API_KEY | Server-side access to the configured Replit AI Integration. |
| AI_INTEGRATIONS_OPENAI_BASE_URL | Replit AI Integration endpoint. |
| PUBLIC_OBJECT_SEARCH_PATHS, PRIVATE_OBJECT_DIR | Object-storage paths used for uploaded files where configured. |
| GOOGLE_MAPS_SERVER_KEY, GOOGLE_MAPS_BROWSER_KEY | Optional map and place-search features. |
| RESOURCEBRIDGE_ORGANIZATION_REVIEWER_EMAILS | Optional allowlist for organization review authority. |
| VITE_CLERK_PROXY_URL | Optional Clerk proxy configuration for supported hosting setups. |

Never put real values in this README or in committed source files. The web app also requires PORT and BASE_PATH when starting Vite; use the configured Replit workflow values or set them for your own host.

### Start the services

Run the API server and web app as separate services. In Replit, start the configured **API Server** and **ResourceBridge web** workflows. For other hosting environments, route the web app’s /api requests to the API server and configure the appropriate port and base path.

```sh
# Terminal 1: API server
pnpm --filter @workspace/api-server run dev

# Terminal 2: ResourceBridge web app
pnpm --filter @workspace/resourcebridge run dev
```

### Initialize a development database

For a fresh or explicitly approved development database, apply the workspace schema with:

```sh
pnpm --filter @workspace/db run push
```

Review the generated schema changes before applying them to any database containing important or production data. Do not use a force-push command on production data.

## Build and type-check

```sh
pnpm --filter @workspace/resourcebridge run typecheck
pnpm --filter @workspace/resourcebridge run build
pnpm --filter @workspace/api-server run typecheck
```

The workspace also provides a root-level type-check command:

```sh
pnpm run typecheck
```

## Security notes

- Use a separate development database and test identity-provider configuration when experimenting.
- Keep API credentials and private values out of Git history, issue reports, screenshots, and chat messages.
- Grant organization-review and staff permissions only through the application’s trusted authorization settings.
- Treat AI output as assistance, not as authoritative policy, medical advice, or confirmation that a booking has been approved.

## Contributing

Contributions should preserve role-based permissions, protect account data, and keep demo data separate from real user records. Before opening a pull request, run the relevant type-checks and build commands above, and describe any required environment configuration without including secret values.

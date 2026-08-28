# Postman Pro

Independent API client workbench inspired by modern API testing workflows. It does not contain Postman proprietary source code or assets.

## Run
~~~bash
npm install
npm run dev
~~~
Open http://localhost:5173.

Production: `npm run build && npm start`.

## Working features
- HTTP request builder: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Query parameters and headers
- JSON/text request body
- Bearer, Basic, API Key and OAuth 2.0 client-credentials authentication
- Environment variables with `{{variable}}` substitution
- Local collections and request history
- Server-side HTTP proxy with timeout protection
- Response status, headers, timing, size, pretty/raw views
- OpenAPI JSON endpoint import
- Pre-request script editor and response assertions
- Markdown API documentation export
- Mock response endpoint
- cURL generation and request JSON export
- GitHub Actions build verification

## Roadmap
GraphQL execution, WebSocket client, executable JavaScript sandbox for scripts/tests, multipart file upload, OpenAPI YAML import, request chaining, persistent mock definitions, team workspaces, encrypted secrets, cloud sync and desktop packaging.

## Architecture
`React/Vite frontend -> Express API gateway/proxy -> target APIs`

Keep credentials out of source control. OAuth client secrets should be supplied at runtime and should not be committed to the repository.

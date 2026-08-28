# Postman Pro MCP

Postman Pro exposes its API platform through the Model Context Protocol (MCP), allowing AI clients to work with collections, OpenAPI definitions, request execution, code generation, and collection runs.

## Start locally

```bash
npm install
npm run mcp
```

The MCP endpoint is:

```text
http://127.0.0.1:8788/mcp
```

## Available tools

- `list_capabilities` — discover Postman Pro capabilities.
- `normalize_collection` — normalize a collection using the Postman Collection SDK.
- `import_openapi` — convert OpenAPI/Swagger to a collection.
- `generate_client_code` — generate client snippets using Postman Code Generators.
- `execute_request` — execute one live HTTP request.
- `run_collection` — execute a collection through Newman.

## MCP resource

`postman://instructions` contains safe agent guidance for API discovery, testing, code generation, and secret handling.

## Example client configuration

For an MCP client that supports Streamable HTTP, point it at:

```text
http://127.0.0.1:8788/mcp
```

The server intentionally binds to loopback by default. Do not expose it publicly without authentication and host/origin protection.

## Design

The MCP layer delegates to the same platform services used by the Postman Pro API server. It does not copy Postman's desktop application code. It uses compatible open-source building blocks for collection modeling, OpenAPI conversion, code generation, and collection execution.

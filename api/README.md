# API folder

This folder contains a generated OpenAPI 3.0 spec and a Postman collection based on `API_DOCUMENTATION.md`.

Files:
- `openapi.yaml` — OpenAPI 3.0.3 specification for the Dominion Seedstars API.
- `postman_collection.json` — Postman collection with representative requests and examples.

Quick usage

1. Swagger / OpenAPI
- Open `api/openapi.yaml` in the Swagger Editor (https://editor.swagger.io/) or import it into Swagger UI to explore endpoints.

2. Postman
- Open Postman and `File -> Import` the `api/postman_collection.json` file.
- Create an environment variable `bearer_token` and set it to a valid JWT for authenticated requests.
- The `base_url` variable is set to `https://api.dominion-seedstars.com/v1` by default.

Next steps you may want:
- Validate `openapi.yaml` with a linter (e.g., Spectral) and expand component schemas for every response model.
- Add more example requests/responses and full schema definitions for Reports, Dashboards, and Settings.
- Optionally export the OpenAPI to JSON for codegen: `yaml2json api/openapi.yaml > api/openapi.json`.

If you want, I can:
- Run validation (Spectral) and fix issues.
- Produce a complete schema for every response model.
- Commit these files to a branch and open a PR.

# web-api-capture-session workflow

Declarative workflow for full-chain web API capture: navigate to a target page, optionally replay interaction steps, collect network activity, extract auth signals, and optionally export HAR output.

## Entry File

- `workflow.ts`

## Workflow ID

- `workflow.web-api-capture-session.v1`

## Structure

This workflow translates the built-in `handleWebApiCaptureSession` orchestration into a declarative graph:

- `network_enable` to start request and exception capture
- `console_inject_fetch_interceptor` and `console_inject_xhr_interceptor` to persist frontend traffic
- `page_navigate` to load the target page
- Optional action branches for `page_click`, `page_type`, and `page_evaluate`
- `page_evaluate` delay step to let async requests settle
- `network_get_stats` and `network_get_requests` for request collection
- `network_extract_auth` for auth/token discovery
- Optional `network_export_har` branch for artifact export
- `console_execute` summary step for downstream runners

## Tools Used

- `network_enable`
- `console_inject_fetch_interceptor`
- `console_inject_xhr_interceptor`
- `page_navigate`
- `page_click`
- `page_type`
- `page_evaluate`
- `network_get_stats`
- `network_get_requests`
- `network_extract_auth`
- `network_export_har`
- `console_execute`

## Config

- `workflows.webApiCapture.url`
- `workflows.webApiCapture.waitUntil`
- `workflows.webApiCapture.enableClickStep`
- `workflows.webApiCapture.clickSelector`
- `workflows.webApiCapture.enableTypeStep`
- `workflows.webApiCapture.typeSelector`
- `workflows.webApiCapture.typeText`
- `workflows.webApiCapture.enableEvaluateStep`
- `workflows.webApiCapture.evaluateExpression`
- `workflows.webApiCapture.waitAfterActionsMs`
- `workflows.webApiCapture.exportHar`
- `workflows.webApiCapture.harOutputPath`

## Local Validation

1. Run `pnpm install`.
2. Run `pnpm typecheck`.
3. Put this repo under a configured `workflows/` extension root.
4. Run `extensions_reload` in `jshookmcp`.
5. Confirm the workflow appears in `extensions_list`.
6. Execute the workflow with your runner and verify request capture, auth extraction, and optional HAR export.

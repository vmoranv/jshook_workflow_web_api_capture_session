# web-api-capture-session workflow

Declarative workflow for navigating a target page, replaying optional actions, capturing network traffic, extracting auth material, and optionally exporting HAR output.

## Entry File

- `workflow.ts`

## Workflow ID

- `workflow.web-api-capture-session.v1`

## Structure

This workflow mirrors the built-in `handleWebApiCaptureSession` flow in declarative form:

- `SequenceNode`: end-to-end orchestration
- `BranchNode`: optional click / type / evaluate / HAR export steps
- `ToolNode`: network enablement, interceptor injection, navigation, capture, extraction, summary

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

- `workflows.webApiCapture.url` (default: `https://example.com`)
- `workflows.webApiCapture.waitUntil` (default: `domcontentloaded`)
- `workflows.webApiCapture.enableClickStep` (default: `false`)
- `workflows.webApiCapture.clickSelector` (default: `button[data-capture]`)
- `workflows.webApiCapture.enableTypeStep` (default: `false`)
- `workflows.webApiCapture.typeSelector` (default: `input[name='query']`)
- `workflows.webApiCapture.typeText` (default: `capture me`)
- `workflows.webApiCapture.enableEvaluateStep` (default: `false`)
- `workflows.webApiCapture.evaluateExpression` (default: `window.__captureProbe = true`)
- `workflows.webApiCapture.waitAfterActionsMs` (default: `1500`)
- `workflows.webApiCapture.exportHar` (default: `true`)
- `workflows.webApiCapture.harOutputPath` (default: `artifacts/har/jshook-capture-<timestamp>.har`)

## Local Validation

1. Load the repo as a workflow extension root in `jshookmcp`.
2. Run `extensions_reload`.
3. Confirm the workflow appears in `extensions_list`.
4. Trigger the workflow with config values for your target page.
5. Verify interceptor injection, request capture, auth extraction, and optional HAR export.

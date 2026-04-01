import { createWorkflow, SequenceNodeBuilder, } from '@jshookmcp/extension-sdk/workflow';
const workflowId = 'workflow.web-api-capture-session.v1';
function isoTimestampForFile() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
export default createWorkflow(workflowId, 'Web API Capture Session')
    .description('Delegate to the built-in web_api_capture_session tool using only valid action types (click/type/wait/evaluate), then emit a concise summary.')
    .tags(['workflow', 'capture', 'network', 'auth', 'har', 'reverse'])
    .timeoutMs(10 * 60_000)
    .defaultMaxConcurrency(1)
    .buildGraph((ctx) => {
    const prefix = 'workflows.webApiCapture';
    const url = ctx.getConfig(`${prefix}.url`, 'https://example.com');
    const waitUntil = ctx.getConfig(`${prefix}.waitUntil`, 'domcontentloaded');
    const waitAfterActionsMs = ctx.getConfig(`${prefix}.waitAfterActionsMs`, 1500);
    const enableTypeStep = ctx.getConfig(`${prefix}.enableTypeStep`, false);
    const typeSelector = ctx.getConfig(`${prefix}.typeSelector`, "input[name='query']");
    const typeText = ctx.getConfig(`${prefix}.typeText`, 'capture me');
    const enableClickStep = ctx.getConfig(`${prefix}.enableClickStep`, false);
    const clickSelector = ctx.getConfig(`${prefix}.clickSelector`, 'button[data-capture]');
    const enableWaitStep = ctx.getConfig(`${prefix}.enableWaitStep`, false);
    const waitSelector = ctx.getConfig(`${prefix}.waitSelector`, '');
    const waitText = ctx.getConfig(`${prefix}.waitText`, '');
    const waitDelayMs = ctx.getConfig(`${prefix}.waitDelayMs`, 0);
    const enableEvaluateStep = ctx.getConfig(`${prefix}.enableEvaluateStep`, false);
    const evaluateExpression = ctx.getConfig(`${prefix}.evaluateExpression`, 'window.__captureProbe = true');
    const exportHar = ctx.getConfig(`${prefix}.exportHar`, true);
    const exportReport = ctx.getConfig(`${prefix}.exportReport`, false);
    const harOutputPath = ctx.getConfig(`${prefix}.harOutputPath`, `workflow-smoke-capture-${isoTimestampForFile()}.har`);
    const reportOutputPath = ctx.getConfig(`${prefix}.reportOutputPath`, `workflow-smoke-capture-report-${isoTimestampForFile()}.md`);
    const actions = [];
    if (enableTypeStep) {
        actions.push({ type: 'type', selector: typeSelector, text: typeText });
    }
    if (enableClickStep) {
        actions.push({ type: 'click', selector: clickSelector });
    }
    if (enableWaitStep) {
        const waitAction = { type: 'wait' };
        if (waitSelector)
            waitAction['selector'] = waitSelector;
        if (waitText)
            waitAction['text'] = waitText;
        if (waitDelayMs > 0)
            waitAction['delayMs'] = waitDelayMs;
        actions.push(waitAction);
    }
    if (enableEvaluateStep) {
        actions.push({ type: 'evaluate', expression: evaluateExpression });
    }
    const root = new SequenceNodeBuilder('web-api-capture-session-root');
    root.tool('capture-session', 'web_api_capture_session', {
        input: {
            url,
            waitUntil,
            actions,
            waitAfterActionsMs,
            exportHar,
            exportReport,
            harOutputPath,
            reportOutputPath,
        },
    });
    root.tool('capture-summary', 'console_execute', {
        input: {
            expression: `(${JSON.stringify({
                status: 'web_api_capture_sequence_complete',
                workflowId,
                url,
                waitUntil,
                actions,
                exportHar,
                exportReport,
                harOutputPath,
                reportOutputPath,
            })})`,
        },
    });
    return root;
})
    .onStart((ctx) => {
    ctx.emitMetric('workflow_runs_total', 1, 'counter', {
        workflowId,
        stage: 'start',
    });
})
    .onFinish((ctx) => {
    ctx.emitMetric('workflow_runs_total', 1, 'counter', {
        workflowId,
        stage: 'finish',
    });
})
    .onError((ctx, error) => {
    ctx.emitMetric('workflow_errors_total', 1, 'counter', {
        workflowId,
        error: error.name,
    });
})
    .build();

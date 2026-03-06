import {
  branchNode,
  sequenceNode,
  toolNode,
} from '@jshookmcp/extension-sdk/workflow';
import type { WorkflowContract } from '@jshookmcp/extension-sdk/workflow';

const workflowId = 'workflow.web-api-capture-session.v1';

function isoTimestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

const webApiCaptureSessionWorkflow: WorkflowContract = {
  kind: 'workflow-contract',
  version: 1,
  id: workflowId,
  displayName: 'Web API Capture Session',
  description:
    'Navigate a page, optionally replay actions, capture requests, extract auth material, and optionally export a HAR artifact.',
  tags: ['workflow', 'capture', 'network', 'auth', 'har', 'reverse'],
  timeoutMs: 10 * 60_000,
  defaultMaxConcurrency: 1,

  build(ctx) {
    const url = ctx.getConfig<string>(
      'workflows.webApiCapture.url',
      'https://example.com',
    );
    const waitUntil = ctx.getConfig<string>(
      'workflows.webApiCapture.waitUntil',
      'domcontentloaded',
    );

    const enableClickStep = ctx.getConfig<boolean>(
      'workflows.webApiCapture.enableClickStep',
      false,
    );
    const clickSelector = ctx.getConfig<string>(
      'workflows.webApiCapture.clickSelector',
      'button[data-capture]',
    );

    const enableTypeStep = ctx.getConfig<boolean>(
      'workflows.webApiCapture.enableTypeStep',
      false,
    );
    const typeSelector = ctx.getConfig<string>(
      'workflows.webApiCapture.typeSelector',
      "input[name='query']",
    );
    const typeText = ctx.getConfig<string>(
      'workflows.webApiCapture.typeText',
      'capture me',
    );

    const enableEvaluateStep = ctx.getConfig<boolean>(
      'workflows.webApiCapture.enableEvaluateStep',
      false,
    );
    const evaluateExpression = ctx.getConfig<string>(
      'workflows.webApiCapture.evaluateExpression',
      'window.__captureProbe = true',
    );

    const waitAfterActionsMs = ctx.getConfig<number>(
      'workflows.webApiCapture.waitAfterActionsMs',
      1500,
    );
    const exportHar = ctx.getConfig<boolean>(
      'workflows.webApiCapture.exportHar',
      true,
    );
    const harOutputPath = ctx.getConfig<string>(
      'workflows.webApiCapture.harOutputPath',
      `artifacts/har/jshook-capture-${isoTimestampForFile()}.har`,
    );

    const enableNetwork = toolNode('enable-network', 'network_enable', {
      input: {
        enableExceptions: true,
      },
    });

    const injectFetch = toolNode(
      'inject-fetch-interceptor',
      'console_inject_fetch_interceptor',
    );

    const injectXhr = toolNode(
      'inject-xhr-interceptor',
      'console_inject_xhr_interceptor',
    );

    const navigate = toolNode('navigate-target', 'page_navigate', {
      input: {
        url,
        waitUntil,
        enableNetworkMonitoring: true,
      },
    });

    const clickBranch = branchNode(
      'optional-click-step',
      'web_api_capture_enable_click',
      toolNode('click-action', 'page_click', {
        input: {
          selector: clickSelector,
        },
      }),
      toolNode('skip-click-action', 'console_execute', {
        input: {
          expression: '({ skipped: "click", reason: "config_disabled" })',
        },
      }),
      () => enableClickStep,
    );

    const typeBranch = branchNode(
      'optional-type-step',
      'web_api_capture_enable_type',
      toolNode('type-action', 'page_type', {
        input: {
          selector: typeSelector,
          text: typeText,
          delay: 20,
        },
      }),
      toolNode('skip-type-action', 'console_execute', {
        input: {
          expression: '({ skipped: "type", reason: "config_disabled" })',
        },
      }),
      () => enableTypeStep,
    );

    const evaluateBranch = branchNode(
      'optional-evaluate-step',
      'web_api_capture_enable_evaluate',
      toolNode('evaluate-action', 'page_evaluate', {
        input: {
          code: evaluateExpression,
        },
      }),
      toolNode('skip-evaluate-action', 'console_execute', {
        input: {
          expression: '({ skipped: "evaluate", reason: "config_disabled" })',
        },
      }),
      () => enableEvaluateStep,
    );

    const settleRequests = toolNode('settle-requests', 'page_evaluate', {
      input: {
        code: `new Promise((resolve) => setTimeout(() => resolve({ waitedMs: ${Math.max(0, waitAfterActionsMs)} }), ${Math.max(0, waitAfterActionsMs)}))`,
      },
      timeoutMs: Math.max(5_000, waitAfterActionsMs + 2_000),
    });

    const getStats = toolNode('get-network-stats', 'network_get_stats');

    const getRequests = toolNode('get-network-requests', 'network_get_requests', {
      input: {
        limit: 500,
        offset: 0,
      },
    });

    const extractAuth = toolNode('extract-auth-material', 'network_extract_auth', {
      input: {
        minConfidence: 0.4,
      },
    });

    const exportHarBranch = branchNode(
      'optional-har-export',
      'web_api_capture_export_har',
      toolNode('export-har', 'network_export_har', {
        input: {
          outputPath: harOutputPath,
          includeBodies: false,
        },
      }),
      toolNode('skip-har-export', 'console_execute', {
        input: {
          expression: '({ skipped: "network_export_har", reason: "config_disabled" })',
        },
      }),
      () => exportHar,
    );

    const summarize = toolNode('capture-summary', 'console_execute', {
      input: {
        expression:
          `({ status: "web_api_capture_sequence_complete", workflowId: "${workflowId}", url: ${JSON.stringify(url)}, waitUntil: ${JSON.stringify(waitUntil)}, exportedHar: ${exportHar ? 'true' : 'false'}, harOutputPath: ${JSON.stringify(harOutputPath)}, expectedNext: ["inspect network_get_stats result", "inspect network_get_requests result", "inspect network_extract_auth result"] })`,
      },
    });

    return sequenceNode('web-api-capture-session-root', [
      enableNetwork,
      injectFetch,
      injectXhr,
      navigate,
      clickBranch,
      typeBranch,
      evaluateBranch,
      settleRequests,
      getStats,
      getRequests,
      extractAuth,
      exportHarBranch,
      summarize,
    ]);
  },

  onStart(ctx) {
    ctx.emitMetric('workflow_runs_total', 1, 'counter', {
      workflowId,
      stage: 'start',
    });
  },

  onFinish(ctx) {
    ctx.emitMetric('workflow_runs_total', 1, 'counter', {
      workflowId,
      stage: 'finish',
    });
  },

  onError(ctx, error) {
    ctx.emitMetric('workflow_errors_total', 1, 'counter', {
      workflowId,
      error: error.name,
    });
  },
};

export default webApiCaptureSessionWorkflow;

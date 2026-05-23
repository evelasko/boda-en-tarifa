/**
 * Phase C1 — parallel tool execution within a turn.
 *
 * Asserts that when Claude emits multiple tool_use blocks, the pipeline
 * executes them concurrently via Promise.all (not sequentially) and that
 * recordedCalls preserves the original block order in the audit trail.
 *
 * The concurrency assertion uses a barrier: each stubbed executeTool
 * call increments a counter and resolves only after every tool call has
 * been invoked. If the pipeline ran them sequentially, the first call
 * would block forever waiting for a counter that only it can advance,
 * and the test would time out.
 */

// Stub the Anthropic SDK before requiring the pipeline so the require
// chain inside the compiled module picks up the mock.
let nextResponses = [];

jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockImplementation(async () => {
        if (nextResponses.length === 0) {
          throw new Error("no stubbed Anthropic responses left");
        }
        return nextResponses.shift();
      }),
    },
  }));
});

const toolStarts = [];
let barrierResolve;
let pending = 0;
let target = 0;
let barrier;

function resetBarrier(n) {
  toolStarts.length = 0;
  pending = 0;
  target = n;
  barrier = new Promise((resolve) => {
    barrierResolve = resolve;
  });
}

jest.mock("../../lib/bot/claude/tools.js", () => ({
  TOOLS: [],
  executeTool: jest.fn().mockImplementation(async (name) => {
    toolStarts.push({name, t: Date.now()});
    pending += 1;
    if (pending >= target) barrierResolve();
    await barrier;
    return {output: {ok: true, name}};
  }),
}));

const {runTurn} = require("../../lib/bot/claude/pipeline.js");

function toolUseBlock(id, name) {
  return {type: "tool_use", id, name, input: {}};
}

function textBlock(text) {
  return {type: "text", text};
}

describe("runTurn — Phase C1 parallel tool execution", () => {
  beforeEach(() => {
    nextResponses = [];
  });

  test("executes 3 tool_use blocks concurrently and preserves block order", async () => {
    resetBarrier(3);

    // First response: 3 tool_use blocks. Second response: a final text
    // so the iteration loop terminates.
    nextResponses.push({
      stop_reason: "tool_use",
      content: [
        toolUseBlock("tu_1", "get_guest_context"),
        toolUseBlock("tu_2", "lookup_events"),
        toolUseBlock("tu_3", "get_current_weather"),
      ],
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    });
    nextResponses.push({
      stop_reason: "end_turn",
      content: [textBlock("done")],
      usage: {
        input_tokens: 4,
        output_tokens: 2,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    });

    const out = await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "header",
      history: [],
      currentText: "hola",
      kbBlock: "kb",
      requestId: "req-1",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    // If the pipeline had been sequential, the first tool call's
    // executeTool would await the barrier alone (pending=1 < target=3)
    // and never resolve. Reaching this line proves concurrency.
    expect(toolStarts).toHaveLength(3);
    expect(toolStarts.map((s) => s.name)).toEqual([
      "get_guest_context",
      "lookup_events",
      "get_current_weather",
    ]);

    // Block order preserved in the audit trail regardless of resolution order.
    expect(out.toolCalls.map((c) => c.name)).toEqual([
      "get_guest_context",
      "lookup_events",
      "get_current_weather",
    ]);
    expect(out.text).toBe("done");
  });
});

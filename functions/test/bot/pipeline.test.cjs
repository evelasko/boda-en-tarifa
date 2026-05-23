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
 *
 * Also covers buildInitialMessages trim behavior (2026-05-23 fix —
 * see `bot/docs/fix-message-doubling-plan.md`): the trailing user
 * history entry whose text equals `currentText` is dropped before
 * appending the composite user content, so Claude never sees the
 * current turn twice.
 */

// Stub the Anthropic SDK before requiring the pipeline so the require
// chain inside the compiled module picks up the mock.
let nextResponses = [];
const messagesCreateCalls = [];

jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockImplementation(async (args) => {
        messagesCreateCalls.push(args);
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
    messagesCreateCalls.length = 0;
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

    // Regression: when executeTool returns no `errored` flag (success
    // path), recordedCalls must coerce to a concrete `false` — Firestore
    // rejects `undefined` nested values, which on 2026-05-23 broke
    // every tool-call reply's outbound audit write in production.
    for (const call of out.toolCalls) {
      expect(call.errored).toBe(false);
      expect(call.errored).not.toBeUndefined();
    }
  });
});

describe("buildInitialMessages — trim duplicate current turn", () => {
  beforeEach(() => {
    nextResponses = [];
    messagesCreateCalls.length = 0;
  });

  function pushEndTurn() {
    nextResponses.push({
      stop_reason: "end_turn",
      content: [textBlock("ok")],
      usage: {
        input_tokens: 1,
        output_tokens: 1,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    });
  }

  test("drops the trailing user turn when its text matches currentText", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "hola"},
        {role: "assistant", text: "hi"},
        {role: "user", text: "where to park?"},
      ],
      currentText: "where to park?",
      kbBlock: "kb",
      requestId: "req-trim-1",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    expect(messagesCreateCalls).toHaveLength(1);
    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({role: "user", content: "hola"});
    expect(msgs[1]).toEqual({role: "assistant", content: "hi"});
    expect(msgs[2].role).toBe("user");
    expect(typeof msgs[2].content).toBe("string");
    expect(msgs[2].content.startsWith("[Per-guest header]")).toBe(true);
    expect(msgs[2].content).toContain("USER: where to park?");
  });

  test("no-op when history does not end with currentText", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "hola"},
        {role: "assistant", text: "hi"},
      ],
      currentText: "where to park?",
      kbBlock: "kb",
      requestId: "req-trim-2",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({role: "user", content: "hola"});
    expect(msgs[1]).toEqual({role: "assistant", content: "hi"});
    expect(msgs[2].role).toBe("user");
    expect(msgs[2].content).toContain("USER: where to park?");
  });

  test("empty history yields only the composite user message", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [],
      currentText: "hola",
      kbBlock: "kb",
      requestId: "req-trim-3",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe("user");
    expect(msgs[0].content.startsWith("[Per-guest header]")).toBe(true);
    expect(msgs[0].content).toContain("USER: hola");
  });

  test("identical text mid-history is preserved; only trailing match is dropped", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "ok"},
        {role: "assistant", text: "..."},
        {role: "user", text: "ok"},
      ],
      currentText: "ok",
      kbBlock: "kb",
      requestId: "req-trim-4",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({role: "user", content: "ok"});
    expect(msgs[1]).toEqual({role: "assistant", content: "..."});
    expect(msgs[2].role).toBe("user");
    expect(msgs[2].content).toContain("USER: ok");
    expect(msgs[2].content.startsWith("[Per-guest header]")).toBe(true);
  });
});

describe("buildInitialMessages — sanitize corrupted history", () => {
  beforeEach(() => {
    nextResponses = [];
    messagesCreateCalls.length = 0;
  });

  function pushEndTurn() {
    nextResponses.push({
      stop_reason: "end_turn",
      content: [textBlock("ok")],
      usage: {
        input_tokens: 1,
        output_tokens: 1,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    });
  }

  test("drops a run of trailing user turns when audit gaps stack (2026-05-23 scenario)", async () => {
    // Reproduces the production state: Thora's audit writes for the
    // prior turns failed, so Henry's recent inbounds sit in history
    // with no assistant turn between them. The current inbound's text
    // is different from all of them (he moved on to a new question).
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "hola"},
        {role: "assistant", text: "¡hola Henry!"},
        {role: "user", text: "¿quién es javier otero?"},
        {role: "user", text: "tengo ansiedad, ¿qué hago?"},
        {role: "user", text: "¿no tienes nada que sugerirme?"},
      ],
      currentText: "¿dónde está el 100% fun?",
      kbBlock: "kb",
      requestId: "req-corrupt-1",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    // Expect: [u "hola", a "¡hola Henry!", composite] — all three
    // trailing user turns are gone, the prior clean turn remains.
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({role: "user", content: "hola"});
    expect(msgs[1]).toEqual({role: "assistant", content: "¡hola Henry!"});
    expect(msgs[2].role).toBe("user");
    expect(msgs[2].content).toContain("USER: ¿dónde está el 100% fun?");
    // None of the stale user texts should leak in via earlier history.
    expect(msgs[0].content).not.toContain("javier otero");
    expect(msgs[0].content).not.toContain("ansiedad");
  });

  test("drops a trailing user turn even when its text differs from currentText", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "hola"},
        {role: "assistant", text: "hi"},
        {role: "user", text: "stale unanswered question"},
      ],
      currentText: "new question",
      kbBlock: "kb",
      requestId: "req-corrupt-2",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({role: "user", content: "hola"});
    expect(msgs[1]).toEqual({role: "assistant", content: "hi"});
    expect(msgs[2].content).toContain("USER: new question");
    expect(msgs[2].content).not.toContain("stale unanswered question");
  });

  test("collapses interior consecutive user turns to the most recent in each run", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "u1"},
        {role: "assistant", text: "a1"},
        {role: "user", text: "u2-stale"},
        {role: "user", text: "u3-kept"},
        {role: "assistant", text: "a2"},
      ],
      currentText: "current",
      kbBlock: "kb",
      requestId: "req-corrupt-3",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    // Expect: [u "u1", a "a1", u "u3-kept", a "a2", composite] —
    // u2-stale was collapsed away in favor of the more recent u3-kept.
    expect(msgs).toHaveLength(5);
    expect(msgs[0]).toEqual({role: "user", content: "u1"});
    expect(msgs[1]).toEqual({role: "assistant", content: "a1"});
    expect(msgs[2]).toEqual({role: "user", content: "u3-kept"});
    expect(msgs[3]).toEqual({role: "assistant", content: "a2"});
    expect(msgs[4].role).toBe("user");
    expect(msgs[4].content).toContain("USER: current");
  });

  test("clean alternating history is preserved unchanged", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "user", text: "u1"},
        {role: "assistant", text: "a1"},
        {role: "user", text: "u2"},
        {role: "assistant", text: "a2"},
      ],
      currentText: "u3",
      kbBlock: "kb",
      requestId: "req-corrupt-4",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(5);
    expect(msgs[0]).toEqual({role: "user", content: "u1"});
    expect(msgs[1]).toEqual({role: "assistant", content: "a1"});
    expect(msgs[2]).toEqual({role: "user", content: "u2"});
    expect(msgs[3]).toEqual({role: "assistant", content: "a2"});
    expect(msgs[4].content).toContain("USER: u3");
  });

  test("history with only an assistant turn (e.g. proactive Thora message) is kept", async () => {
    pushEndTurn();
    await runTurn({
      apiKey: "test-key",
      phone: "+34600000000",
      language: "es",
      perTurnHeader: "[Per-guest header]\nGuest: Test",
      history: [
        {role: "assistant", text: "¡Hola! Soy Thora 🐾"},
      ],
      currentText: "hola",
      kbBlock: "kb",
      requestId: "req-corrupt-5",
      guestId: "g-1",
      inboundMessageId: "wamid.test",
    });

    const msgs = messagesCreateCalls[0].messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({role: "assistant", content: "¡Hola! Soy Thora 🐾"});
    expect(msgs[1].content).toContain("USER: hola");
  });
});

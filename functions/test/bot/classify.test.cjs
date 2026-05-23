const {classifyEvents} = require("../../lib/bot/webhook/classify.js");

function envelope(messages, statuses) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "+34600000000",
                phone_number_id: "PHONE_NUMBER_ID",
              },
              contacts: [
                {profile: {name: "Alice"}, wa_id: "34612345678"},
              ],
              ...(messages ? {messages} : {}),
              ...(statuses ? {statuses} : {}),
            },
          },
        ],
      },
    ],
  };
}

describe("classifyEvents", () => {
  test("classifies a text message and carries profile name + phoneNumberId", () => {
    const events = classifyEvents(
      envelope([
        {
          from: "34612345678",
          id: "wamid.TEXT1",
          timestamp: "1700000000",
          type: "text",
          text: {body: "hola"},
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "text",
      messageId: "wamid.TEXT1",
      from: "34612345678",
      profileName: "Alice",
      text: "hola",
      phoneNumberId: "PHONE_NUMBER_ID",
    });
  });

  test("classifies an interactive message", () => {
    const events = classifyEvents(
      envelope([
        {
          from: "34612345678",
          id: "wamid.INT1",
          timestamp: "1700000000",
          type: "interactive",
          interactive: {type: "button_reply", button_reply: {id: "yes"}},
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "interactive",
      messageId: "wamid.INT1",
      interactiveType: "button_reply",
    });
  });

  test.each(["image", "video", "document", "sticker"])(
    "classifies media kind %s",
    (mediaType) => {
      const events = classifyEvents(
        envelope([
          {
            from: "34612345678",
            id: `wamid.${mediaType}`,
            timestamp: "1700000000",
            type: mediaType,
            [mediaType]: {id: "media-id"},
          },
        ])
      );
      expect(events[0]).toMatchObject({kind: "media", mediaType});
    }
  );

  test("classifies audio as a first-class kind with mediaId + mimeType", () => {
    const events = classifyEvents(
      envelope([
        {
          from: "34612345678",
          id: "wamid.AUDIO1",
          timestamp: "1700000000",
          type: "audio",
          audio: {id: "audio-media-id", mime_type: "audio/ogg; codecs=opus"},
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "audio",
      messageId: "wamid.AUDIO1",
      from: "34612345678",
      mediaId: "audio-media-id",
      mimeType: "audio/ogg; codecs=opus",
    });
  });

  test("marks audio without an id as unsupported", () => {
    const events = classifyEvents(
      envelope([
        {
          from: "34612345678",
          id: "wamid.AUDIO_BAD",
          timestamp: "1700000000",
          type: "audio",
          audio: {},
        },
      ])
    );
    expect(events[0]).toMatchObject({
      kind: "unsupported",
      reason: "audio_missing_id",
    });
  });

  test("classifies a delivery status", () => {
    const events = classifyEvents(
      envelope(undefined, [
        {
          id: "wamid.OUT1",
          status: "delivered",
          timestamp: "1700000001",
          recipient_id: "34612345678",
        },
      ])
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "status",
      messageId: "wamid.OUT1",
      status: "delivered",
      recipientId: "34612345678",
    });
  });

  test("marks unknown message types as unsupported with reason", () => {
    const events = classifyEvents(
      envelope([
        {
          from: "34612345678",
          id: "wamid.LOC1",
          timestamp: "1700000000",
          type: "location",
          location: {latitude: 36, longitude: -5},
        },
      ])
    );
    expect(events[0]).toMatchObject({
      kind: "unsupported",
      reason: "unhandled_type:location",
    });
  });

  test("returns unsupported when the envelope is malformed", () => {
    const events = classifyEvents({nope: true});
    expect(events).toEqual([
      expect.objectContaining({kind: "unsupported", reason: "schema_invalid"}),
    ]);
  });

  test("ignores changes whose field is not 'messages'", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {field: "account_review_update", value: {decision: "APPROVED"}},
          ],
        },
      ],
    };
    expect(classifyEvents(payload)).toEqual([]);
  });

  test("yields multiple events when both messages and statuses are present", () => {
    const events = classifyEvents(
      envelope(
        [
          {
            from: "34612345678",
            id: "wamid.TEXT1",
            timestamp: "1700000000",
            type: "text",
            text: {body: "hi"},
          },
        ],
        [
          {
            id: "wamid.OUT1",
            status: "read",
            timestamp: "1700000001",
            recipient_id: "34612345678",
          },
        ]
      )
    );
    expect(events.map((e) => e.kind).sort()).toEqual(["status", "text"]);
  });
});

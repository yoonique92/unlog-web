import { describe, expect, it } from "vitest";

import {
  getDevelopmentSampleFriends,
  MAX_DEVELOPMENT_MOCK_FRIENDS,
  parseDevelopmentMockFriendCount,
} from "./developmentPreview";

describe("development friend preview", () => {
  const sampleFriends = ["sample-1", "sample-2", "sample-3", "sample-4", "sample-5"];

  it("returns sample friends in development", () => {
    expect(
      getDevelopmentSampleFriends({
        isDevelopment: true,
        sampleFriends,
      })
    ).toEqual(sampleFriends);
  });

  it("returns no sample friends in production", () => {
    expect(
      getDevelopmentSampleFriends({
        isDevelopment: false,
        sampleFriends,
      })
    ).toEqual([]);
  });

  it("keeps displayed real friends production-only and adds samples in development", () => {
    const realFriends = ["real-1"];

    expect([
      ...getDevelopmentSampleFriends({
        isDevelopment: false,
        sampleFriends,
      }),
      ...realFriends,
    ]).toEqual(realFriends);

    expect([
      ...getDevelopmentSampleFriends({
        isDevelopment: true,
        sampleFriends,
      }),
      ...realFriends,
    ]).toHaveLength(6);
  });

  it.each([1, 8, 9, 16, 17, 24, 25, 30])(
    "accepts mockFriends=%i in development",
    (count) => {
      expect(
        parseDevelopmentMockFriendCount(
          `?mockFriends=${count}`,
          true
        )
      ).toBe(count);
    }
  );

  it("is disabled outside development", () => {
    expect(
      parseDevelopmentMockFriendCount("?mockFriends=30", false)
    ).toBeNull();
  });

  it.each(["", "0", "31", "1.5", "abc", "-1"])(
    "rejects unsupported count %j",
    (count) => {
      expect(
        parseDevelopmentMockFriendCount(
          count ? `?mockFriends=${count}` : "",
          true
        )
      ).toBeNull();
    }
  );

  it("keeps the documented preview maximum at 30", () => {
    expect(MAX_DEVELOPMENT_MOCK_FRIENDS).toBe(30);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  getProductionDataSource,
  isPostgresSourceEnabled,
} from "./config";

const ENV_NAME = "UNLOG_POSTGRES_SOURCE_V1";
const originalValue = process.env[ENV_NAME];

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_NAME];
  } else {
    process.env[ENV_NAME] = originalValue;
  }
});

describe("production data-source config", () => {
  it.each([
    [undefined, "json", false],
    ["false", "json", false],
    ["TRUE", "json", false],
    ["true", "postgres", true],
  ] as const)("maps %s to %s", (value, expectedSource, expectedEnabled) => {
    if (value === undefined) delete process.env[ENV_NAME];
    else process.env[ENV_NAME] = value;

    expect(getProductionDataSource()).toBe(expectedSource);
    expect(isPostgresSourceEnabled()).toBe(expectedEnabled);
  });
});

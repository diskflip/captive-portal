import assert from "node:assert/strict";
import { joinUrl } from "../app/lib/cambium-easypass.ts";

const cases: Array<[base: string, path: string, expected: string]> = [
  [
    "https://us-e1.api.cloud.cambiumnetworks.com",
    "api/v2/ext-portals/login",
    "https://us-e1.api.cloud.cambiumnetworks.com/api/v2/ext-portals/login",
  ],
  [
    "https://us-e1.api.cloud.cambiumnetworks.com/",
    "api/v2/ext-portals/login",
    "https://us-e1.api.cloud.cambiumnetworks.com/api/v2/ext-portals/login",
  ],
];

for (const [base, path, expected] of cases) {
  assert.equal(joinUrl(base, path), expected);
}

console.log("ok: joinUrl(base, path) produces the expected cnMaestro login URL");

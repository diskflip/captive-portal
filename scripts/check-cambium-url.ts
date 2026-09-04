import assert from "node:assert/strict";
import { joinUrl } from "../app/lib/cambium-easypass.ts";

const cases: Array<[base: string, path: string, expected: string]> = [
  [
    "https://us-e1.api.cloud.cambiumnetworks.com",
    "api/v1/easypass/external-portal/login",
    "https://us-e1.api.cloud.cambiumnetworks.com/api/v1/easypass/external-portal/login",
  ],
  [
    "https://us-e1.api.cloud.cambiumnetworks.com/",
    "api/v1/easypass/external-portal/login",
    "https://us-e1.api.cloud.cambiumnetworks.com/api/v1/easypass/external-portal/login",
  ],
];

for (const [base, path, expected] of cases) {
  assert.equal(joinUrl(base, path), expected);
}

console.log("ok: joinUrl(base, path) produces the expected cnMaestro login URL");

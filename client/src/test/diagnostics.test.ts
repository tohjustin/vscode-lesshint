"use strict";

import * as assert from "assert";
import * as vscode from "vscode";
import { activate, getDocUri } from "./helper";

describe("Should get diagnostics", () => {
  const docUri = getDocUri("diagnostics.less");

  it("Diagnoses less files", async () => {
    await testDiagnostics(docUri, [
      {
        message: "Hexadecimal color \"#33333\" should be either three or six characters long.",
        range: toRange(0, 12, 1, 0),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "lesshint",
      },
      {
        message: "Unit \"zz\" is not allowed for \"font-size\".",
        range: toRange(4, 13, 5, 0),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "lesshint",
      },
      {
        message: "\"font-weight\" should be before \"justify-content\"",
        range: toRange(6, 2, 7, 0),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "lesshint",
      },
    ]);
  });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
  await activate(docUri);

  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}

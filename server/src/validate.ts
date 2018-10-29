"use strict";

import {
  Diagnostic as LesshintDiagnostic,
} from "lesshint";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver";

/**
 * Converts `column` & `line` attribute from `Lesshint.checkString()` result into LSP `Range`
 */
function convertRange(column: number, line: number): Range {
  const range: Range = {
    end: { line, character: 0 },
    start: { line: line - 1, character: column - 1 },
  };

  return range;
}

/**
 * Converts `severity` attribute from `Lesshint.checkString()` result into LSP `DiagnosticSeverity`
 */
function convertSeverity(severity: string): DiagnosticSeverity | undefined {
  switch (severity) {
    case "error":
      return DiagnosticSeverity.Error;
    case "warning":
      return DiagnosticSeverity.Warning;
    default:
      return undefined;
  }
}

/**
 * Converts `Lesshint.checkString()` result into LSP `Diagnostic`
 */
export function convertDiagnostics(lesshintDiagnostics: LesshintDiagnostic[]): Diagnostic[] {
  return lesshintDiagnostics.map((lesshintDiagnostic: LesshintDiagnostic) => {
    const diagnostic: Diagnostic = {
      code: lesshintDiagnostic.linter,
      message: lesshintDiagnostic.message,
      range: convertRange(lesshintDiagnostic.column, lesshintDiagnostic.line),
      severity: convertSeverity(lesshintDiagnostic.severity),
      source: "lesshint",
    };

    return diagnostic;
  });
}

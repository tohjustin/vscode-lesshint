declare module 'lesshint' {
  type DiagnosticSeverity =
    | "error"
    | "warning";

  interface Diagnostic {
    column: number,
    file: string,
    fullPath: string,
    line: number,
    linter: string,
    message: string,
    severity: DiagnosticSeverity,
  }

  export class Lesshint {
    checkFiles(patterns: any): any;
    checkString(input: string, checkPath?: string): Diagnostic[];
    configure(config: any): any;
    formatResults(files: any, resolve: any, reject: any): any;
    getConfig(path: any): any;
    getReporter(reporter?: string): any;
    hasAllowedExtension(file: any): any;
    runOnFile(checkPath: any): any;
    stripExtensionDot(extension: any): any;
  }
}

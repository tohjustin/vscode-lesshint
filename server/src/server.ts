"use strict";

import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  ProposedFeatures,
  TextDocument,
  TextDocuments,
} from "vscode-languageserver";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments();

// Capabilities
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

// Settings
interface IExtensionSettings {} // tslint:disable-line no-empty-interface
const defaultSettings: IExtensionSettings = {};
let globalSettings: IExtensionSettings = defaultSettings;
const documentSettings: Map<string, Thenable<IExtensionSettings>> = new Map();

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();
  const pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray;

  let problems = 0;
  const diagnostics: Diagnostic[] = [];
  while ((m = pattern.exec(text)) && problems < 1000) { // tslint:disable-line no-conditional-assignment
    problems++;
    const diagnosic: Diagnostic = {
      message: `${m[0]} is all uppercase.`,
      range: {
        end: textDocument.positionAt(m.index + m[0].length),
        start: textDocument.positionAt(m.index),
      },
      severity: DiagnosticSeverity.Warning,
      source: "ex",
    };

    diagnostics.push(diagnosic);
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability =
    capabilities.workspace && !!capabilities.workspace.configuration;
  hasWorkspaceFolderCapability =
    capabilities.workspace && !!capabilities.workspace.workspaceFolders;

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
    },
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined,
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((event) => {
      connection.console.log(`Workspace folder change event received: ${JSON.stringify(event)}`);
    });
  }
});

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = (
      (change.settings.lesshint || defaultSettings)
    ) as IExtensionSettings;
  }

  connection.console.log(`Global Settings: ${JSON.stringify(globalSettings)}`);
  documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles((change) => {
  connection.console.log(`We received an file change event: ${JSON.stringify(change)}`);
  documents.all().forEach(validateTextDocument);
});

documents.onDidChangeContent(({ document }) => {
  validateTextDocument(document);
});

documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

documents.listen(connection);

connection.listen();

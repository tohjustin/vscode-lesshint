'use strict';

import {
	createConnection,
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	InitializeParams,
	ProposedFeatures,
	TextDocument,
	TextDocuments,
} from 'vscode-languageserver';

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments();

// Capabilities
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

// Settings
interface ExtensionSettings {}
const defaultSettings: ExtensionSettings = {};
let globalSettings: ExtensionSettings = defaultSettings;
let documentSettings: Map<string, Thenable<ExtensionSettings>> = new Map();

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < 1000) {
		problems++;
		let diagnosic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};

		diagnostics.push(diagnosic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability =
		capabilities.workspace && !!capabilities.workspace.configuration;
	hasWorkspaceFolderCapability =
		capabilities.workspace && !!capabilities.workspace.workspaceFolders;

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
		}
	};
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExtensionSettings>(
			(change.settings.lesshint || defaultSettings)
		);
	}

	connection.console.log(`Global Settings: ${JSON.stringify(globalSettings)}`);
	documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles(_change => {
	connection.console.log('We received an file change event');
	documents.all().forEach(validateTextDocument);
});


documents.onDidChangeContent(({ document }) => {
	validateTextDocument(document)
});

documents.onDidClose(e => {
	documentSettings.delete(e.document.uri)
});

documents.listen(connection);

connection.listen();

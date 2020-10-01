import * as vscode from 'vscode';
import {commands, workspace} from 'vscode';

import {lintActiveTextDocument, lintTextDocument} from './lint';
import {killRosLint} from './roslint';

export function activate(context: vscode.ExtensionContext) {
  let subscriptions = context.subscriptions;

  let diagnosticCollection = vscode.languages.createDiagnosticCollection();
  subscriptions.push(diagnosticCollection);

  let loggingChannel = vscode.window.createOutputChannel('Ros lint');
  subscriptions.push(loggingChannel);

  async function lintAndSetDiagnostics(file: vscode.TextDocument) {
    const diagnostics = await lintTextDocument(file, loggingChannel);
    diagnosticCollection.set(file.uri, diagnostics);
  }

  async function lintActiveDocAndSetDiagnostics() {
    const diag = await lintActiveTextDocument(loggingChannel);
    if (diag.document) {
      diagnosticCollection.set(diag.document.uri, diag.diagnostics);
    }
  }

  subscriptions.push(workspace.onDidSaveTextDocument((doc) => {
    if (workspace.getConfiguration('roslint').get('lintOnSave')) {
      lintAndSetDiagnostics(doc);
    }
  }));
  subscriptions.push(workspace.onDidOpenTextDocument(lintAndSetDiagnostics));
  subscriptions.push(workspace.onDidCloseTextDocument(
      (doc) => diagnosticCollection.delete(doc.uri)));

  subscriptions.push(workspace.onWillSaveTextDocument(killRosLint));

  subscriptions.push(workspace.onDidChangeConfiguration((config) => {
    if (config.affectsConfiguration('roslint')) {
      workspace.textDocuments.forEach((doc) => lintAndSetDiagnostics(doc));
    }
  }));

  subscriptions.push(
      commands.registerCommand('roslint.lint', lintActiveDocAndSetDiagnostics));

  workspace.textDocuments.forEach((doc) => lintAndSetDiagnostics(doc));
}

// this method is called when your extension is deactivated
export function deactivate() {}

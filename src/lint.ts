import * as vscode from 'vscode';

import {collectDiagnostics, runRosLint} from './roslint';

export async function lintActiveTextDocument(
    loggingChannel: vscode.OutputChannel) {
  if (vscode.window.activeTextEditor === undefined) {
    return {document: undefined, diagnostics: []};
  }

  return {
    document: vscode.window.activeTextEditor.document,
    diagnostics: await lintTextDocument(
        vscode.window.activeTextEditor.document, loggingChannel),
  };
}

export async function lintTextDocument(
    file: vscode.TextDocument, loggingChannel: vscode.OutputChannel) {
  let enable = ['cpp', 'c'].includes(file.languageId) ?
      vscode.workspace.getConfiguration('roslint').get('enableCpp') :
      vscode.workspace.getConfiguration('roslint').get('enablePython');
  if (!enable) {
    return [];
  }
  if (!['cpp', 'c', 'python'].includes(file.languageId)) {
    return [];
  }
  if (file.uri.scheme !== 'file') {
    return [];
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(file.uri);
  if (!workspaceFolder) {
    return [];
  }

  const rosLintOut = await runRosLint(
      [file.uri.fsPath], workspaceFolder.uri.fsPath, loggingChannel);
  return collectDiagnostics(rosLintOut, file);
}

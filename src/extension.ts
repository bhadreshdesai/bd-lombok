// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Commands, commandDefs } from "./commands";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  commandDefs.forEach((commandDef) => {
    let disposable = vscode.commands.registerCommand(
      commandDef.name,
      commandDef.callback
    );
    context.subscriptions.push(disposable);
  });
  vscode.commands.executeCommand(Commands.ENABLE_LOMBOK);
}

// this method is called when your extension is deactivated
export function deactivate() {}

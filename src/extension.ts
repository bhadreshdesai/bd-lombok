// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, Event, ExtensionContext, Uri } from "vscode";
import {
  Commands,
  commandDefs,
  enableLombokIfRequired,
  getJavaExtensionApi,
} from "./commands";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  commandDefs.forEach((commandDef) => {
    let disposable = commands.registerCommand(
      commandDef.name,
      commandDef.callback
    );
    context.subscriptions.push(disposable);
  });

  // Subscribe to onDidClasspathUpdate event. When classpath changes check to see if lombok is required
  // TODO: use a config paramter to automatically enable/disable lombok on classpath change
  const javaExtensionApi = await getJavaExtensionApi();
  if (javaExtensionApi.onDidClasspathUpdate) {
    const onDidClasspathUpdate: Event<Uri> =
      javaExtensionApi.onDidClasspathUpdate;
    context.subscriptions.push(
      onDidClasspathUpdate(async () => {
        await enableLombokIfRequired();
      })
    );
  }

  // TODO: Do we enable lombok irrespective of the classpath or based on the classpath
  await enableLombokIfRequired();
}

// this method is called when your extension is deactivated
export function deactivate() {}

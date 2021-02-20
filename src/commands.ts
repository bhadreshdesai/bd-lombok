import * as vscode from "vscode";

export namespace Commands {
  /**
   * Enable Lombok extension
   */
  export const ENABLE_LOMBOK = "bd-lombok.enablelombok";

  /**
   * Diable Lombok extension
   */
  export const DISABLE_LOMBOK = "bd-lombok.disablelombok";
}

type CommandDefintion = {
  name: string;
  callback: (...args: any[]) => any;
};

function cmdEnableLombok() {
  vscode.window.showInformationMessage("cmdEnableLombok");
}

function cmdDisableLombok() {
  vscode.window.showInformationMessage("cmdDisableLombok");
}

export const commandDefs: CommandDefintion[] = [
  { name: Commands.ENABLE_LOMBOK, callback: cmdEnableLombok },
  { name: Commands.DISABLE_LOMBOK, callback: cmdDisableLombok },
];

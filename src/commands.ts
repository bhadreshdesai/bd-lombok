import * as path from "path";
import * as url from "url";
import {
  commands,
  ConfigurationTarget,
  Extension,
  ExtensionContext,
  extensions,
  window,
  workspace,
} from "vscode";

namespace Constants {
  /**
   * Classpath scope used to get the classpath from the java extension
   */
  export const CLASSPATH_SCOPE: string = "runtime";
  /**
   * bd-lombok extension
   */
  export const EXTENSION_BD_LOMBOK: string = "bhadreshdesai.bd-lombok";
  /**
   * Java Language Support extension
   */
  export const EXTENSION_JAVA: string = "redhat.java";
  /**
   * java.jdt.ls.vmargs key used by the Java Language Server
   */
  export const KEY_JDT_LS_VMARGS: string = "java.jdt.ls.vmargs";
  /**
   * lib path where lombok jar file is stored
   */
  export const LIB_PATH: string = "lib";
  /**
   * Lombok jar file name
   */
  export const LOMBOK_JAR: string = "lombok.jar";
  /**
   * Regular expression to find the lombok jar in the classpath or vmargs
   */
  export const LOMBOK_REGEX: RegExp = /lombok.+\.jar/;
}

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
  callback: (...args: any[]) => any | Promise<any>;
};

// Utils start ================================================================
function getExtensionPath(): string {
  const lombokExtension = extensions.getExtension(
    Constants.EXTENSION_BD_LOMBOK
  );
  if (!lombokExtension) {
    throw new Error(
      `Unable to get an instance of extension ${Constants.EXTENSION_BD_LOMBOK}`
    );
  }
  return lombokExtension.extensionPath;
}

export async function getJavaExtensionApi(): Promise<any> {
  // TODO: Find a way to use ExtensionAPI inteface from the redhat.java extension
  const javaExtension: Extension<any> | undefined = extensions.getExtension(
    Constants.EXTENSION_JAVA
  );
  if (javaExtension === undefined) {
    throw new Error(
      "Language Support for Java(TM) by Red Hat extension is required."
    );
  }
  const javaExtensionApi: any = await javaExtension.activate();
  if (javaExtensionApi.getClasspaths === undefined) {
    throw new Error(
      `getClassPaths function not found in the ${Constants.EXTENSION_JAVA} extension`
    );
  }
  return javaExtensionApi;
}

const getLombokJarPath = () =>
  path.join(getExtensionPath(), Constants.LIB_PATH, Constants.LOMBOK_JAR);

const getLombokJavaAgentArg = () => `-javaagent:"${getLombokJarPath()}"`;

const lombokJarExistsInString = (instring: string) =>
  Constants.LOMBOK_REGEX.test(instring);

async function removeLombokJavaAgentArg(): Promise<void> {
  console.log("Remove lombok from vmargs");
  let vmargsCheck: string | undefined = workspace
    .getConfiguration()
    .get(Constants.KEY_JDT_LS_VMARGS);
  console.log(`Existing vmargs: ${vmargsCheck}`);
  if (vmargsCheck) {
    const lombokJavaAgentArg: string = getLombokJavaAgentArg();
    const vmargs: string = vmargsCheck.replace(lombokJavaAgentArg, "");
    console.log(`New vmargs: ${vmargs}`);
    if (vmargs !== vmargsCheck) {
      console.log(`removeLombokJavaAgentArg Setting vmargs: ${vmargs}`);
      await workspace
        .getConfiguration()
        .update(
          Constants.KEY_JDT_LS_VMARGS,
          vmargs,
          ConfigurationTarget.Workspace
        );
    }
  }
}

async function setLombokJavaAgentArg(): Promise<void> {
  const lombokJavaAgentArg: string = getLombokJavaAgentArg();
  let lombokExists: boolean = false;
  const vmargsCheck: string | undefined = workspace
    .getConfiguration()
    .get(Constants.KEY_JDT_LS_VMARGS);
  if (vmargsCheck) {
    lombokExists = lombokJarExistsInString(vmargsCheck);
  }
  console.log(
    `lombokExists in vmargs: ${lombokExists}, vmargsCheck: ${vmargsCheck}`
  );
  if (!lombokExists) {
    const vmargs: string = vmargsCheck
      ? `${vmargsCheck} ${lombokJavaAgentArg}`
      : lombokJavaAgentArg;
    console.log(`setLombokJavaAgentArg Setting vmargs: ${vmargs}`);
    await workspace
      .getConfiguration()
      .update(
        Constants.KEY_JDT_LS_VMARGS,
        vmargs,
        ConfigurationTarget.Workspace
      );
  }
}
// Utils end ==================================================================

// Commands start =============================================================
export async function enableLombokIfRequired() {
  const lombokExists: boolean = await isLombokInClassPath();
  if (lombokExists) {
    await setLombokJavaAgentArg();
  } else {
    await removeLombokJavaAgentArg();
  }
}

async function cmdEnableLombok(): Promise<any> {
  await setLombokJavaAgentArg();
}

async function cmdDisableLombok(): Promise<void> {
  await removeLombokJavaAgentArg();
}

async function isLombokInClassPath(): Promise<boolean> {
  var lombokExists: boolean = false;
  if (workspace.workspaceFolders) {
    // root folder is the first folder in the workspaceFolders array
    // get the uripath of the root folder so we can use it to get the classpath from the java extension api
    const uripath: string = url
      .pathToFileURL(workspace.workspaceFolders[0].uri.fsPath)
      .toString();
    // Get the java extension api to get the claspath from the root project
    const javaExtensionApi: any = await getJavaExtensionApi();
    const classpathResult = await javaExtensionApi.getClasspaths(uripath, {
      scope: Constants.CLASSPATH_SCOPE,
    });
    if (classpathResult) {
      // check if the classpath contains lombok jar
      classpathResult.classpaths.every((cp: string) => {
        lombokExists = lombokJarExistsInString(cp);
        // Exit the loop if we found lombok jar in the classpath
        return !lombokExists;
      });
    }
  }
  return lombokExists;
}
// Commands end ===============================================================

export const commandDefs: CommandDefintion[] = [
  { name: Commands.ENABLE_LOMBOK, callback: cmdEnableLombok },
  { name: Commands.DISABLE_LOMBOK, callback: cmdDisableLombok },
];

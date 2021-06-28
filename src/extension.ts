import * as vscode from "vscode";
import {getConfig, getUserData} from "./utils/config";

import {RemoteBuildService} from "./services/rb.service";
import {RemoteBuildTreeProvider} from "./providers/rbTree.provider";
import {TextDocumentProvider} from "./providers/rbTextDocument.provider";
import {exec} from "shelljs";
export async function activate(context: vscode.ExtensionContext) {
  await getConfig();
  await getUserData();

  const rbp = new RemoteBuildTreeProvider();
  const tdp = new TextDocumentProvider();
  const rb = new RemoteBuildService(rbp, tdp);

  vscode.commands.registerCommand("remoteBuilderExt.refreshBuilds", () =>
    rbp.refresh()
  );
  vscode.commands.registerCommand("remoteBuilderExt.goToImage", (build) => {
    rb.goToLibraryImage(build);
  });
  vscode.commands.registerCommand(
    "remoteBuilderExt.viewBuild",
    async (build) => {
      rb.viewBuildDef(build);
    }
  );
  vscode.commands.registerCommand(
    "remoteBuilderExt.viewOutput",
    async (build) => {
      rb.viewBuildOutput(build);
    }
  );
  vscode.commands.registerCommand(
    "remoteBuilderExt.deleteBuild",
    async (build) => {
      rb.deleteBuild(build);
    }
  );

  exec(`which singularity`, (code) => {
    if (code == 0) {
      vscode.commands.executeCommand(
        "setContext",
        "remoteBuilderExt.hasSingularity",
        true
      );
      vscode.commands.registerCommand(
        "remoteBuilderExt.pullImage",
        async (build) => {
          rb.pullImage(build);
        }
      );
    }
  });

  vscode.window.registerTreeDataProvider("remoteBuilds", rbp);
  context.subscriptions.push(
    vscode.commands.registerCommand("remoteBuilderExt.validateDef", () => {
      rb.validateDef();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("remoteBuilderExt.submitBuild", () => {
      rb.submitBuild();
    })
  );

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("singularity", tdp)
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

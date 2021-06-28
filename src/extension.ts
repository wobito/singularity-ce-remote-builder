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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "remote-builder.validateDef",
      rb.validateDef
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "remote-builder.submitBuild",
      rb.submitBuild
    )
  );
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("singularity", tdp)
  );

  vscode.commands.registerCommand("remote-builder.refreshBuilds", () =>
    rbp.refresh()
  );
  vscode.commands.registerCommand("remote-builder.goToImage", (build) =>
    rb.goToLibraryImage(build)
  );
  vscode.commands.registerCommand("remote-builder.viewBuild", async (build) =>
    rb.viewBuildDef(build)
  );
  vscode.commands.registerCommand("remote-builder.viewOutput", async (build) =>
    rb.viewBuildOutput(build)
  );
  vscode.commands.registerCommand("remote-builder.deleteBuild", async (build) =>
    rb.deleteBuild(build)
  );

  exec(`which singularity`, (code) => {
    if (code == 0) {
      vscode.commands.executeCommand(
        "setContext",
        "remote-builder.hasSingularity",
        true
      );
      vscode.commands.registerCommand(
        "remote-builder.pullImage",
        async (build) => {
          rb.pullImage(build);
        }
      );
    }
  });

  vscode.window.registerTreeDataProvider("remoteBuilds", rbp);
}

// this method is called when your extension is deactivated
export function deactivate() {}

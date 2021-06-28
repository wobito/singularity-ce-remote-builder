import * as vscode from "vscode";
import * as dayjs from "dayjs";
import * as path from "path";
import {config, userData} from "../utils/config";

import {http} from "../utils/http";

export class RemoteBuildTreeProvider implements vscode.TreeDataProvider<Build> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Build | undefined | null | void
  > = new vscode.EventEmitter<Build | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Build | undefined | null | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Build): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Build): Promise<Build[]> {
    const arr: any[] = [];
    try {
      const res = await http.get(
        `${config.builderAPI.uri}/v1/build?user=${userData.id}`
      );
      Object.values(res.data.data).map((b: any) => {
        if (typeof b !== "undefined") {
          let item = new Build(b, vscode.TreeItemCollapsibleState.None);
          arr.push(item);
        }
      });
    } catch (e) {
      console.log(e.response);
    }
    return Promise.resolve(arr);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class Build extends vscode.TreeItem {
  constructor(
    public build: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(build.id, collapsibleState);
    this.label = this.getLibRef();
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.contextValue = "build";

    this.command = {
      command: "remote-builder.viewBuild",
      arguments: [this],
      title: "View Build",
    };
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "..",
      "images",
      "light",
      "build.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "..",
      "images",
      "dark",
      "build.svg"
    ),
  };

  getLibRef() {
    return this.build.libraryRef.replace(/library:\/\//, "");
  }

  getTooltip() {
    const date = dayjs(this.build.completeTime).format(
      "MM/DD/YYYY [at] HH:mm:ss"
    );
    if (this.build.imageSize > 0) {
      return `${this.getImageSize()} - ${date}`;
    }
    return date;
  }

  getImageSize() {
    if (this.build.imageSize > 0) {
      return (this.build.imageSize / 2 ** 20).toFixed(2).toString() + `MB`;
    }
    return false;
  }

  getDescription() {
    if (this.build.imageSize > 0) {
      return `${this.getImageSize()} - Completed`;
    } else {
      return `Build Failed`;
    }
  }
}

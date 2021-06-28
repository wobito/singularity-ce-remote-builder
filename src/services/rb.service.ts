import {RemoteBuildTreeProvider} from "../providers/rbTree.provider";
import {TextDocumentProvider} from "../providers/rbTextDocument.provider";

import {config, getConfig, singularityConfig} from "../utils/config";
import {http} from "../utils/http";
import {workspace, Uri, window, ProgressLocation, env} from "vscode";

import * as dayjs from "dayjs";
import * as WebSocket from "ws";

export class RemoteBuildService {
  rbp: RemoteBuildTreeProvider;
  tdp: TextDocumentProvider;
  constructor(rbp: RemoteBuildTreeProvider, tdp: TextDocumentProvider) {
    this.rbp = rbp;
    this.tdp = tdp;
  }

  async askLibraryRef() {
    const result = await window.showInputBox({
      value: "",
      valueSelection: [2, 4],
      placeHolder: "For example: entity/collection/container:tag",
    });
    return result;
  }

  async submitBuild() {
    const defData = await this.validateDef();
    const config = await getConfig();
    const url = `${config.builderAPI.uri}/v1/build`;
    const text = window.activeTextEditor?.document.getText();
    const libraryRef = await this.askLibraryRef();
    if (libraryRef) {
      try {
        window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: "Building SIF....",
          },
          async (_, __) => {
            const r = await http.post(url, {
              definition: defData,
              buildReceipe: text,
              libraryRef: "library://" + libraryRef,
            });

            if (typeof r.data.error !== "undefined") {
              window.showErrorMessage("Build Failure: " + r.data.error.message);
              return;
            }
            if (r.data) {
              const p = new Promise<void>((resolve) => {
                const output = window.createOutputChannel("buildOutput");
                const socket = new WebSocket(
                  r.data.data.wsURL +
                    `?auth_token=${singularityConfig["APIToken"]}`
                );
                output.show();
                socket.onopen = () => {
                  output.clear();
                };
                socket.onmessage = (e: any) => {
                  if (e.data !== "") {
                    output.append(e.data);
                  }
                };
                socket.onclose = async () => {
                  const res = await http.get(`${url}/${r.data.data.id}`);
                  const completedAt = dayjs(res.data.data.completeTime).format(
                    "DD/MM/YYYY [at] HH:mm:ss"
                  );

                  output.appendLine("Build Completed at " + completedAt);
                  output.appendLine(
                    "Build Complete - View your built image at " +
                      singularityConfig["cloudUrl"] +
                      "/library/" +
                      libraryRef
                  );
                  window.showInformationMessage(
                    "Build Completed at " + completedAt
                  );
                  resolve();
                };
              });
              return p;
            }
          }
        );
      } catch (e) {
        console.log(e);
        window.showErrorMessage("Build Failure: " + e);
      }
    }
  }

  async validateDef() {
    if (!singularityConfig["APIToken"]) {
      window.showErrorMessage("No Auth Token Set");
      return;
    }
    const config = await getConfig();
    const url = `${config.builderAPI.uri}/v1/convert-def-file`;
    const text = window.activeTextEditor?.document.getText();
    try {
      const response = await http.post(url, text);
      if (typeof response.data.error !== "undefined") {
        window.showErrorMessage(
          "DEF File Invalid: " + response.data.error.message
        );
        return;
      }

      if (response.data.data) {
        window.showInformationMessage("DEF File Valid!");
        return response.data.data;
      }
    } catch (e) {
      console.log(e);
      window.showErrorMessage("DEF File Invalid: " + e);
    }
  }

  async deleteBuild(build: any) {
    const res = await window.showInformationMessage(
      "Are you sure you want to delete this build?",
      {
        modal: true,
      },
      ...["Yes, Delete it", "No"]
    );
    if (res === "Yes, Delete it") {
      const resp = await http.delete(
        `${config.builderAPI.uri}/v1/build/${build.build.id}`
      );
      if (resp.status === 200) {
        this.rbp.refresh();
      }
    }
  }

  async viewBuildDef(build: any) {
    if (build.build.buildRecipe) {
      this.tdp.setBodyText(build.build.buildRecipe);
      const file = build.build.libraryRef.split("/");

      let uri = Uri.parse("singularity:" + file.slice(-1).pop() + ".def");
      let doc = await workspace.openTextDocument(uri);
      await window.showTextDocument(doc, {preview: false});
    } else {
      window.showErrorMessage("No build recipe stored for this build");
    }
  }

  async viewBuildOutput(build: any) {
    const resp = await http.get(
      `${config.builderAPI.uri}/v1/build-output/${build.build.id}`
    );
    if (resp.status === 200) {
      this.tdp.setBodyText(resp.data);
      let uri = Uri.parse("singularity:" + build.build.id + "-output.log");
      let doc = await workspace.openTextDocument(uri);
      await window.showTextDocument(doc, {preview: false});
    }
  }

  goToLibraryImage(build: any) {
    const ref = build.build.libraryRef
      .replace(/library:\/\//, "")
      .split(":")
      .slice(0, 1)
      .join("");
    console.log(ref);
    env.openExternal(
      Uri.parse(`${singularityConfig["cloudUrl"]}/library/${ref}`)
    );
  }
}

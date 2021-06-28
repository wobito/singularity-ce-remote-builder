import {workspace} from "vscode";
import * as jwt from "jsonwebtoken";
import {http} from "./http";

export let singularityConfig = workspace.getConfiguration("singularityCE");
export let config: any;
export let userId: any;
export let userData: any;

workspace.onDidChangeConfiguration(async () => {
  singularityConfig = workspace.getConfiguration("singularityCE");

  await getConfig();
  await getUserData();
});

export const getUserId = (): string | null => {
  if (!singularityConfig) {
    throw new Error("no configuration");
  }

  const data = jwt.decode(singularityConfig["APIToken"]);
  if (data) {
    userId = data.sub ?? "";
  }
  return userId;
};

export const getUserData = async () => {
  if (config) {
    userId = getUserId();
    try {
      const resp = await http.get(
        `${config.consentAPI.uri}/v1/admin/users/${userId}`
      );
      userData = resp.data.data;
      return userData;
    } catch (e) {
      console.error(e);
    }
  }
};

export const getConfig = async () => {
  if (!singularityConfig) {
    throw new Error("no configuration");
  }

  try {
    const resp = await http.get(
      `${singularityConfig["cloudUrl"]}/assets/config/config.prod.json`
    );
    config = resp.data;
    return config;
  } catch (e) {
    console.error(e);
  }
};

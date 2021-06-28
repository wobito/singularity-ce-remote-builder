import axios, {AxiosRequestConfig} from "axios";
import {singularityConfig} from "./config";

axios.interceptors.request.use((config: AxiosRequestConfig) => {
  config.headers["Content-Type"] = "application/json";
  config.headers["Accept"] = "application/json";
  if (singularityConfig["APIToken"]) {
    config.headers["Authorization"] = `Bearer ${singularityConfig["APIToken"]}`;
  }

  return config;
});

export const http = axios;

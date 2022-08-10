import axios, { AxiosRequestConfig } from "axios";
import { singularityConfig } from "./config";

axios.interceptors.request.use((config: AxiosRequestConfig) => {
  if (config.headers) {
    if (singularityConfig["APIToken"]) {
      config.headers[
        "Authorization"
      ] = `Bearer ${singularityConfig["APIToken"]}`;
    }
  }

  return config;
});

export const http = axios;

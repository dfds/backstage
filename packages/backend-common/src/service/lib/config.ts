/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ConfigReader } from '@backstage/config';
import { CorsOptions } from 'cors';

export type BaseOptions = {
  listenPort?: number;
  listenHost?: string;
  baseUrl?: string;
};

export type HttpsSettings = {
  certificate?: CertificateSigningOptions | CertificateFileOptions;
};

export type CertificateFileOptions = {
  key?: string;
  cert?: string;
};

export type CertificateSigningOptions = {
  size?: number;
  algorithm?: string;
  days?: number;
  attributes?: CertificateAttributes;
};

export type CertificateAttributes = {
  commonName?: string;
};

/**
 * Reads some base options out of a config object.
 *
 * @param config The root of a backend config object
 * @returns A base options object
 *
 * @example
 * ```json
 * {
 *   baseUrl: "http://localhost:7000",
 *   listen: "0.0.0.0:7000"
 * }
 * ```
 */
export function readBaseOptions(configReader: ConfigReader): BaseOptions {
  // TODO(freben): Expand this to support more addresses and perhaps optional
  const { host, port } = parseListenAddress(configReader.getString('listen'));
  const baseUrl = configReader.getString('baseUrl');
  return removeUnknown({
    listenPort: port,
    listenHost: host,
    baseUrl: baseUrl,
  });
}

/**
 * Attempts to read a CORS options object from the root of a config object.
 *
 * @param config The root of a backend config object
 * @returns A CORS options object, or undefined if not specified
 *
 * @example
 * ```json
 * {
 *   cors: {
 *    origin: "http://localhost:3000",
 *    credentials: true
 *   }
 * }
 * ```
 */
export function readCorsOptions(
  configReader: ConfigReader,
): CorsOptions | undefined {
  const cc = configReader.getOptionalConfig('cors');
  if (!cc) {
    return undefined;
  }

  return removeUnknown({
    origin: getOptionalStringOrStrings(cc, 'origin'),
    methods: getOptionalStringOrStrings(cc, 'methods'),
    allowedHeaders: getOptionalStringOrStrings(cc, 'allowedHeaders'),
    exposedHeaders: getOptionalStringOrStrings(cc, 'exposedHeaders'),
    credentials: cc.getOptionalBoolean('credentials'),
    maxAge: cc.getOptionalNumber('maxAge'),
    preflightContinue: cc.getOptionalBoolean('preflightContinue'),
    optionsSuccessStatus: cc.getOptionalNumber('optionsSuccessStatus'),
  });
}

/**
 * Attempts to read a https settings object from the root of a config object.
 *
 * @param config The root of a backend config object
 * @returns A https settings object, or undefined if not specified
 *
 * @example
 * ```json
 * {
 *   https: {
 *    certificate: ...
 *   }
 * }
 * ```
 */
export function readHttpsSettings(
  configReader: ConfigReader,
): HttpsSettings | undefined {
  const cc = configReader.getOptionalConfig('https');

  if (!cc) {
    return undefined;
  }

  const certificateConfig = cc.get('certificate');

  const cfg = {
    certificate: certificateConfig,
  };

  return removeUnknown(cfg as HttpsSettings);
}

function getOptionalStringOrStrings(
  configReader: ConfigReader,
  key: string,
): string | string[] | undefined {
  const value = configReader.getOptional(key);
  if (
    value === undefined ||
    typeof value === 'string' ||
    isStringArray(value)
  ) {
    return value;
  }
  throw new Error(`Expected string or array of strings, got ${typeof value}`);
}

function isStringArray(value: any): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }
  for (const v of value) {
    if (typeof v !== 'string') {
      return false;
    }
  }
  return true;
}

function removeUnknown<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

function parseListenAddress(value: string): { host?: string; port?: number } {
  const parts = value.split(':');
  if (parts.length === 1) {
    return { port: parseInt(parts[0], 10) };
  }
  if (parts.length === 2) {
    return { host: parts[0], port: parseInt(parts[1], 10) };
  }
  throw new Error(
    `Unable to parse listen address ${value}, expected <port> or <host>:<port>`,
  );
}

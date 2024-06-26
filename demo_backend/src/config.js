/*
 * Copyright (c) 2024. FoP Consult GmbH
 * All rights reserved.
 */

import {config as dotenvConfig} from '@dotenvx/dotenvx';
import {makeAbsoluteFilePath, makeValidUrlPath} from "./utils.js";

const env = process.env;

export const config = {};

export function updateConfig(dotenvPath, override) {
    if (dotenvPath) {
        dotenvConfig({
            path: dotenvPath,
            override: !!override
        });
    }

    const filesConfig = {
        enabled: env.BACKEND_FILES_ENABLED==="true",
        basePath: makeValidUrlPath(env.BACKEND_FILES_BASE_PATH),
        uploadsPath: makeAbsoluteFilePath(env.BACKEND_FILES_UPLOADS_DIR),
        formFieldId: env.BACKEND_FILES_FORM_FIELD_ID || "content_file",
        jwtSecret: env.BACKEND_FILES_JWT_SECRET || "default-secret",
        jwtExpirationSeconds: parseInt(env.BACKEND_FILES_JWT_EXPIRATION_SECONDS) || 10,
        maxUploadSizeMb: parseInt(env.BACKEND_FILES_MAX_UPLOAD_SIZE_MB) || undefined
    }

    const newConfig = {
        dbUrl: env.BACKEND_DB_URL,
        dbUser: env.BACKEND_DB_USER,
        dbPassword: env.BACKEND_DB_PASSWORD,
        dbDatabase: env.BACKEND_DB_DATABASE,

        serverHost: env.BACKEND_SERVER_HOST,
        serverPort: env.BACKEND_SERVER_PORT,

        apiPath: env.BACKEND_API_ENDPOINT,
        allowOrigin: env.BACKEND_ALLOW_ORIGIN,
        tokenPath: env.BACKEND_OAUTH2_TOKEN_ENDPOINT,

        schemaPath: env.BACKEND_SCHEMA_PATH,
        schemasDir: env.BACKEND_SCHEMAS_DIR,

        devMode: !env.NODE_ENV,

        filesConfig
    }

    Object.assign(config, newConfig);
}



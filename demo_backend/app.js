/*
 * Copyright (c) 2024. FoP Consult GmbH
 * All rights reserved.
 */

import {startServer} from "./src/server.js";
import {updateConfig} from "./src/config.js";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";


const __filename = fileURLToPath(import.meta.url);
global.__root_dir = resolve(dirname(__filename));

updateConfig([
    ".env",
    ".env.default",
]);

startServer().then(() => {
    // server is running
}).catch(err => {
    console.error("Error starting server", err);
});
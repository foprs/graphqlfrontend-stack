/*
 * Copyright (c) 2024. FoP Consult GmbH
 * All rights reserved.
 */

import fs from "fs";
import path from "path";

export function isDirectory(path, checkReadable=true, checkWritable=false) {
    try {
        // Check if the path exists and is a directory
        const stats = fs.statSync(path);
        if (!stats.isDirectory()) {
            return false;
        }

        if(checkReadable)
            fs.accessSync(path, fs.constants.R_OK);

        if(checkWritable)
            fs.accessSync(path, fs.constants.W_OK);

        // If no error was thrown, the directory is readable
        return true;
    } catch (error) {
        // Error occurred, directory is not readable
        return false;
    }
}


export function makeAbsoluteFilePath(filePath, rootDir=__root_dir) {
    if (!filePath)
        return filePath;

    if (filePath.length > 1 && (filePath.endsWith("/") || filePath.endsWith("\\")))
        filePath = filePath.slice(0, -1);

    if (!path.isAbsolute(filePath)) {
        filePath = path.join(rootDir, filePath);
    }

    return filePath;
}

export function makeValidUrlPath(urlPath) {
    if (!urlPath)
        return "";

    if (!urlPath.startsWith("/"))
        urlPath = "/" + urlPath;
    if (urlPath.endsWith("/"))
        urlPath = urlPath.slice(0, -1);

    return urlPath;
}

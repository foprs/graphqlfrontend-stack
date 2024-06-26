/*
 * Copyright (c) 2024. FoP Consult GmbH
 * All rights reserved.
 */

import * as fs from "fs";
import sanitize_filename from "sanitize-filename";
import jwt from "jsonwebtoken";
import fileUpload from "express-fileupload";
import * as path from "path";
import {config} from "./config.js";
import {isDirectory} from "./utils.js";
import {v4 as uuid} from 'uuid';

const GET_TOKEN_PATH = "/get_token";     // path for acquiring a temporary file download token
export const BY_TOKEN_PATH = "/by_token";  // path to get a file download authorized with temporary token as parameter

let localFilesPath = undefined
let localTempPath = undefined;
let baseUrl = undefined;

function deleteTempFiles(filesObject) {
    for (const [_, file] of Object.entries(filesObject)) {
        if (file.tempFilePath) {
            try {
                fs.unlinkSync(file.tempFilePath);
            } finally {
            }
        }
    }
}

function generateLocalFileName(originalFileName, secondTry = false) {
    const ext = originalFileName && path.extname(originalFileName) || ".file";
    let filename = uuid() + ext;

    const filePath = path.join(localFilesPath, filename);

    if (fs.existsSync(filePath)) {
        if (secondTry)
            throw new Error(
                "Two UUIDv4 collisions in a row."
            );
        console.warn("UUIDv4 collision occurred for generated file name: " + originalFileName + "! Trying again.");

        return generateLocalFileName(originalFileName, true);
    }

    return filename;
}

function validateFileNameFormat(filename) {
    if(!filename || filename !== sanitize_filename(filename))
        return false;

    // Valid filename consisting of an UUID and a file extension
    const filename_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\..+$/i;
    return filename.match(filename_pattern);
}


function prepareLocalFilesDirectories() {
    const localPathFailure
        = new Error("Could not obtain, create or access a valid local uploads directory at: " + config.filesConfig.uploadsPath);

    localFilesPath = config.filesConfig.uploadsPath;
    if (!localFilesPath)
        throw localPathFailure;

    localTempPath = path.join(localFilesPath, "temp");

    if (!fs.existsSync(localTempPath)) {
        try {
            fs.mkdirSync(localTempPath, {recursive: true});
        } catch (err) {
            console.log(err);
            throw localPathFailure;
        }
    }

    if (
        !isDirectory(localFilesPath, true, true) ||
        !isDirectory(localTempPath, true, true)
    )
        throw localPathFailure;
}



const getDownloadToken = async function (req, res) {
    const filename = req.params.filename;
    const clientFileName = req.query.filename;

    if(!validateFileNameFormat(filename)) {
        res.status(400).send("missing file name or invalid format");
        return;
    }

    const filePath = path.join(localFilesPath, filename);

    if (!fs.existsSync(filePath)) {
        res.status(404).send("file not found");
        console.log("File not found: " + filePath);
        return;
    }

    const payload = {filename: filename};

    if (clientFileName) {
        payload.clientFileName = clientFileName;
    }

    const download_token = jwt.sign(payload, config.filesConfig.jwtSecret, {expiresIn: config.filesConfig.jwtExpirationSeconds});
    return res.json({download_token});
}

const downloadByToken = async function (req, res) {
    const token = req.params.download_token;

    if (!token) {
        return res.status(400).send("Missing download token parameter.");
    }

    try {
        const payload = jwt.verify(token, config.filesConfig.jwtSecret);

        let filename = payload.filename;
        if (!validateFileNameFormat(filename)) {
            return res.status(400).send("Missing or invalid filename in token payload.")
        }

        const filePath = path.join(localFilesPath, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found");
        }

        console.log("Sending file (by token): " + filePath);
        res.download(filePath, payload.clientFileName || undefined);

    } catch (err) {
        if (err.message === "jwt expired")
            return res.status(401).send("download token expired");
        else
            return res.status(401).send("invalid download token");
    }
}

const handleUpload = async function (req, res) {
    const formFieldId = config.filesConfig.formFieldId;

    const fileObj = req.files[formFieldId];
    if (!fileObj) {
        res.status(400).send("missing file content");
        deleteTempFiles(req.files);
        return;
    }

    let fileName = req.params.filename;

    if (fileName) {
        if (!validateFileNameFormat(fileName)) {
            res.status(400).send("invalid filename format");
            deleteTempFiles(req.files);
            return;
        }
    } else {
        fileName = generateLocalFileName(fileObj.name || "unnamed_file");
    }

    const filePath = path.join(localFilesPath, fileName);
    const isOverwrite = fs.existsSync(filePath);

    console.log("Upload succeeded. Storing file at: " + filePath)
    fileObj.mv(filePath, function (err) {
        // delete temp files after moving file
        delete req.files[formFieldId]; // exclude object with the moved file from file object list
        deleteTempFiles(req.files);

        if (err) {
            console.error("Storing file failed.", err);
            return res.status(500).send("Internal server error on moving uploaded file");
        }

        res.status(isOverwrite ? 200 : 201).send(JSON.stringify(fileName));
    });
}

const handleDelete = async function (req, res) {
    const filename = req.params.filename;

    if (!validateFileNameFormat(filename)) {
        res.status(400).send("invalid filename format");
        return;
    }

    const filePath = path.join(localFilesPath, filename);

    if (!fs.existsSync(filePath)) {
        res.status(404).send("File not found.");
        return;
    }

    fs.unlinkSync(filePath);
    res.status(204).send();
}


export function applyFileservice(app) {
    if (!config.filesConfig.enabled)
        return;

    prepareLocalFilesDirectories();
    baseUrl = config.filesConfig.basePath;

    const fileUploadOptions =
        {
            useTempFiles: true,
            tempFileDir: localTempPath
        };

    if (config.filesConfig.maxUploadSizeMb) {
        fileUploadOptions.limits = {fileSize: config.filesConfig.maxUploadSizeMb * 1024 * 1024}
        fileUploadOptions.abortOnLimit = true;
    }

    // set-up uploader, will inject uploaded file objects into req.files
    app.use(config.filesConfig.basePath, fileUpload(fileUploadOptions));

    // Register Get Download Token
    app.get(baseUrl + GET_TOKEN_PATH + "/:filename", getDownloadToken)

    // Register File Download Handler (by JWT parameter)
    app.get(baseUrl + BY_TOKEN_PATH + "/:download_token", downloadByToken)

    //  File Upload Handlers registration
    app.post(baseUrl, handleUpload);               // create new file
    app.put(baseUrl, handleUpload);                // create new file
    app.put(baseUrl + "/:filename", handleUpload); // overwrite existing file

    //  File Delete Handler registration
    app.delete(baseUrl + "/:filename", handleDelete);
}
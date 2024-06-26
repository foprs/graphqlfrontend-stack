/*
 * Copyright (c) 2024. FoP Consult GmbH
 * All rights reserved.
 */

import {ApolloServer} from "@apollo/server";
import {Neo4jGraphQL} from "@neo4j/graphql";
import {config} from "./config.js";
import express, {json} from "express";
import cors from "cors";
import {expressMiddleware} from "@apollo/server/express4";
import fs from "fs";
import neo4j from "neo4j-driver";
import {applyFileservice} from "./fileservice.js";

export async function startServer() {
    const app = express();

    // Get the Neo4j driver
    const driver = neo4j.driver(
        config.dbUrl,
        neo4j.auth.basic(config.dbUser, config.dbPassword)
    )

    // Prepare the typeDefs
    const allTypeDefsArray = [];
    fs.readdirSync(config.schemasDir).forEach(filename => {
        if (!filename.endsWith(".graphql"))
            return;

        const content = fs.readFileSync(config.schemasDir + "/" + filename, 'utf-8');
        allTypeDefsArray.push(content);
    });

    const typeDefs = allTypeDefsArray.join("\n\n");

    // Prepare the Apollo Context
    const contextGenerator = ({req, res}) => {
        return {
            driver,
            sessionConfig: {database: config.dbDatabase},
            req,
            jwt: res?.locals?.oauth?.token?.user
        };
    }

    // Prepare the Apollo Server
    const apolloServer = new ApolloServer({
        schema: await (new Neo4jGraphQL({typeDefs, driver})).getSchema(),
        introspection: true,
    });
    await apolloServer.start();


    // Add CORS headers
    const allowCorsMiddleware = function (req, res, next) {
        if (config.devMode)
            res.header("Access-Control-Allow-Origin", "*");
        else if(config.allowOrigin)
            res.header("Access-Control-Allow-Origin", config.allowOrigin);

        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH");
        res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, X-File-Name, X-File-Size, X-File-Type");

        if (req.method === "OPTIONS") {
            res.sendStatus(200);
        } else {
            next();
        }
    }
    app.use(allowCorsMiddleware);

    applyFileservice(app)

    // Add the GraphQL API
    app.use(
        config.apiPath, cors(), json(),
        expressMiddleware(apolloServer, {
            context: contextGenerator
        })
    );

    // Provide the GraphQL schema for the frontend
    app.get(config.schemaPath, (req, res) => {
        res.send(typeDefs);
    });

    // Add fake OAuth2 token endpoint (accepts any credentials)
    // In your productive server, you should implement an OAuth2 authentication server here
    app.post(config.tokenPath, (req, res) => {
        res.send({access_token: "dummy", token_type: "Bearer"});
    });

    // Start the server
    await new Promise(resolve => app.listen({port: config.serverPort, host: config.serverHost}, resolve));
    console.log(`Demo Backend running at http://${config.serverHost}:${config.serverPort} using database '${config.dbDatabase}'`)
}
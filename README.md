# GraphQL Frontend

The GraphQL Frontend is a web-based user interface for dynamic data management through a *GraphQL* endpoint implemented using the [Neo4j GraphQL Library](https://neo4j.com/developer/graphql/).

The UI including tables and graph views for listing nodes and relationships as well as forms to view and edit nodes. All UI elements are dynamically generated based on the provided GraphQL schema and allow to view, create, modify and delete nodes and relationships through the provided GraphQL endpoint.

## Features

* Dynamic UI generation based on the provided GraphQL schema
* Listing of nodes and relationships
* View, create, modify and delete nodes and relationships
* Filtering of nodes and relationships
* Sorting of nodes and relationships
* Pagination of nodes and relationships
* File Upload and Download support (using a custom `FileReference` scalar type)
* Automatic generation of forms containing form elements depending on the type of the node property
* Support of Custom Properties
* Individual customization of the UI elements per node type or per node field
* fully executed on client side

## Prerequisites

1. An installed and running recent version of the [Docker Engine](https://docs.docker.com/get-docker/).
2. A valid, personal GraphQL Frontend **License Key**. <br/>Please refer to [https://graphqlfrontend.com/](https://graphqlfrontend.com/) on how to obtain one.

## Initial Setup

1. Clone this repository to your local machine.
2. Open the file `.env.sample` with a text editor and replace the placeholder `{YOUR_FRONTEND_LICENSE_KEY}` with your personal GraphQL Frontend **License Key**.
3. Save the file as `.env`.
4. Run the following command in the repository root directory to create a container for the demo backend service from the sources at *./demo_backend*:

    ```bash
    docker compose build
    ```

## Start

1. Run the following command in the repository root directory to start the GraphQL Frontend and all [dependent services](#provided-services).

    ```bash
    docker compose up -d
    ```
   
2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the GraphQL Frontend.
3. Sign In using **any** credentials. *(The demo backend has no authentication implemented)*

## Stop

Run the following command in the repository root directory to **stop** all services.

```bash
docker compose down
```

## Demo Backend and dependent Services

The GraphQL Frontend is a pure client-side web-app which is not executable stand-alone. It requires a **webserver** to be served to web clients and a **GraphQL endpoint** to connect to. 

### Demo Backend 

The demo backend service provided in this repository is a simple GraphQL server that connects to a Neo4j database and provides a GraphQL endpoint.

The demo backend also includes a sample implementation for the **upload and download of files** demonstrating the use of the `FileReference` scalar type supported by the Frontend. It is used on the `avatarImage` property on the `Person` type in the sample **GraphQL schema** you find at `./schema/types.graphql`.

The container is built from the sources located at `./demo_backend` and in default configuration runs at: http://localhost:3001/.<br/>You can access the GraphQL endpoint using *Apollo Sandbox* at: http://localhost:3001/graphql


### Provided services

The `docker-compose.yml` includes the following services:

- **GraphQL Frontend**: When started, this container just copies the static client-side web application files to the mounted directory `./frontend`
- **Demo Backend**: A simple GraphQL server that connects to a Neo4j database and provides a GraphQL endpoint. 
- Third-party components:
  -  **[Neo4j Database](https://neo4j.com/product/neo4j-graph-database/)** *(Community Edition)*: A Neo4j database instance that is used for data storage by the demo backend service.
  - **[nginx](https://nginx.org/)**: A minimally configured web server that serves the static GraphQL Frontend web application from the `./frontend` directory and in default configuration is accessible at: http://localhost:3000/

Please take a look into the `docker-compose.yml` file and the source files of the demo backend at *./demo_backend* to get a better understanding how all components work together.

## Copyright 

Copyright (c) 2024 [FoP Consult GmbH](https://fop-consult.de/). All rights reserved.
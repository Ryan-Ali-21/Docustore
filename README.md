# Docustore

A project meant to familiarize myself with azure CDN, Azure blob storage, Azure cosmosDB. Based on Gwyneth  Pena-Siguenza’s  "4 projects to get Azure AZ-204 skills (cloud engineer)"

This repository contains one Nodejs webapp (DocuStore) and two Nodejs Azure functions. (GetSAS.js and DeleteFiles.js)

## DocuStore

This app can be deployed by running npm start
You will need an Azure storage account and cosmosdb instance set up to run this app.

  Your cosmosDB instance will need a container called : ToDoList
  Your Azure storage account will need to have a container called: quickstart

the required environment variables are

  - COSMOS_ENDPOINT : your cosmos endpoint
  - COSMOS_KEY: your cosmosdb key
  - AZUURE_STORAGE_ACCOUNT_NAME: Storage account name
  - AZURE_STORAGE_ACCOUNT_CONNECTION_STRING:  Connection string from azure portal
  - sharedKey: This is taken from AZURE_STORAGE_ACCOUNT_CONNECTION_STRING

These variables are meant to be stored in your .env file

## Function Apps

The following function apps were deployed using a combination of vscode and the azure portal.
I deployed a function app the the local workspace in vscode then deployed my local function app to azure using the Azure resource explorer

### GetSAS.js

environment variables called need to be set up in your function app and .env file  

  - AZUURE_STORAGE_ACCOUNT_NAME: Storage account name
  - AZURE_STORAGE_ACCOUNT_CONNECTION_STRING:  Connection string from azure portal
  - sharedKey: This is taken from AZURE_STORAGE_ACCOUNT_CONNECTION_STRING

### DeleteFiles.js

environment variables called need to be set up in your function app and .env file  

  - COSMOS_ENDPOINT : your cosmos endpoint
  - COSMOS_KEY: your cosmosdb key



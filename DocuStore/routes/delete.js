var express = require('express');
require("dotenv").config();
const fs = require('fs');
const CosmosClient = require('@azure/cosmos').CosmosClient
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const axios = require('axios');
const { log } = require('console');

var router = express.Router();

//Azure storage
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) throw Error('Azure Storage accountName not found');

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

 // Create a unique name for the container
const containerName = 'quickstart';


// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName);


const databaseId = 'ToDoList';
const containerId = 'Items'

const options = {
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
      userAgentSuffix: 'CosmosDBJavascriptQuickstart'
    };

const client = new CosmosClient(options)

/**
 * Delete the entry by ID. CosmosDB
 */
async function deleteItem(itemID) {
    await client
      .database(databaseId)
      .container(containerId)
      .item(itemID)
      .delete()
    console.log(`Deleted item:\n${itemID}\n`)
  }
  
  async function deleteBlob(containerClient, blobName){
  
    // include: Delete the base blob and all of its snapshots.
    // only: Delete only the blob's snapshots and not the blob itself.
    const options = {
      deleteSnapshots: 'include' // or 'only'
    }
  
    // Create blob client from container client
    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
  
    await blockBlobClient.delete(options);
  
    console.log(`deleted blob ${blobName}`);
  
  }

  router.post('/', async function(req, res, next) {
    console.log(req.body.fileName);
    try{
    await deleteBlob(containerClient, req.body.fileName);
    }catch{
        console.log("file not found");
    }
    try{
    await deleteItem(req.body.fileID);
    }catch{
        console.log("Error deleting entry from Cosmos");
    }
    res.redirect('/');

  });


  module.exports = router;
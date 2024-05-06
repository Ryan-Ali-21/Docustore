const { app } = require('@azure/functions');
const CosmosClient = require('@azure/cosmos').CosmosClient;
const { BlobServiceClient } = require('@azure/storage-blob'); 
require("dotenv").config();

//Azure storage
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) throw Error('Azure Storage accountName not found');

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

 // Create a unique name for the container
const containerName = 'quickstart';


// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName);

//Delete items from container
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

/**
 *CosmosDB
 */
const databaseId = 'ToDoList';
const containerId = 'Items'

const options = {
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
    userAgentSuffix: 'TimerTrigger1'
  };

const client = new CosmosClient(options)

/**
 * Query the container using SQL
 */
async function queryContainer(sqlQuery) {
    console.log(`Querying container:\n${databaseId}`)
  
    const querySpec = {
      query: sqlQuery
    }
  
    const { resources: results } = await client
      .database(databaseId)
      .container(containerId)
      .items.query(querySpec)
      .fetchAll()
    return results;
  }

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

app.timer('deleteFiles', {
    schedule: '0 * */12 * * *',
    handler: async (myTimer, context) => {

    //Get Expired Items
    sql = "SELECT c.fileName, c.id FROM c WHERE c.expDate < GetCurrentDateTime()";
    files = await queryContainer(sql);


    //Process Expired Items

    for(file of files){
        context.log(`File name: ${file.fileName} File ID: ${file.id} \n`);
        await deleteItem(file.id);
        await deleteBlob(containerClient, file.fileName);
    }
    
        context.log('Timer function processed request.');
    }
});

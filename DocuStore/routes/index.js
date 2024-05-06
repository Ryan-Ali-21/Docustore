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




// Multer configuration
const upload = multer({ dest: 'uploads/' });

//CosmosDB
const databaseId = 'ToDoList';
const containerId = 'Items'

const options = {
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
      userAgentSuffix: 'CosmosDBJavascriptQuickstart'
    };

const client = new CosmosClient(options)


/**
 * Query the container using SQL
 */
async function queryContainer(sqlQuery) {
  console.log(`Querying container:\n${databaseId}`)

  // query to return all children in a family
  // Including the partition key value of country in the WHERE filter results in a more efficient query
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
 * Upload entry to database
 */
async function createItem(itemBody) {
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .items.upsert(itemBody)
  console.log(`Created family item with id:\n${itemBody.id}\n`)
}

/**
 * Delete the entry by ID. CosmosDB
 */
async function deleteFamilyItem(itemBody) {
  await client
    .database(databaseId)
    .container(containerId)
    .item(itemBody.id)
    .delete(itemBody)
  console.log(`Deleted item:\n${itemBody.id}\n`)
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

async function createDBObject(object, filename){

  sqlQuery = "SELECT TOP 1 c.id FROM c ORDER BY c.id DESC";
  id = await queryContainer(sqlQuery);
  console.log("Here -----------------------------------------------");
  console.log(id);
  if(id[0]==null){
    id[0] = { id: -1 };
  }
  console.log(id);
  console.log(id[0].id);
  console.log(typeof id[0].id);
  num = parseInt(id[0].id);
  num++;
  id = num.toString();
 
  tags = object.tags.split(';');

  var entry = {
    "id": id,
    "fileName": filename,
    "date": object.startDate,
    "expDate": object.expDate,
    "author": object.author,
    "tags": tags
  };
  
  return entry;
}

test = queryContainer('SELECT * FROM c');

/* GET home page. */
router.get('/', async function(req, res, next) {

  test = await queryContainer('SELECT * FROM c');
  //console.log(test);
  today= new Date();
  date = today.toISOString().slice(0, -8);
  tempExpDate = new Date(Date.now() + 300 * 1000);
  expDate = tempExpDate.toISOString().slice(0,-8);

  res.render('index', { title: 'Express', results:test, date:date , expDate:expDate});
});


/* POST home page */

router.post('/', upload.single('filename'), async function(req, res, next){

  //ensure file upload
 if (!req.file) {
    return res.status(400).send('No file uploaded.');
}

try{

  console.log(req.body);
  


  const blobName = req.file.originalname
  console.log(blobName);
  newBlobName = blobName.replace(" ","_");
  console.log(newBlobName);
  const blobClient = containerClient.getBlockBlobClient(newBlobName);

  const readableStream = fs.createReadStream(req.file.path);

// Upload the file to Azure Blob Storage
await blobClient.uploadStream(readableStream);


// Delete file after uploading to Azure Blob Storage
fs.unlink(req.file.path, (err) => {
  if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).send('Error deleting file.');
  }
  console.log('File deleted successfully.');
});

//Get SAS using function app

 // Construct the URL for the Azure Function endpoint with query parameters
 const azureFunctionUrl = 'https://blobstorageintegration.azurewebsites.net/api/GetSAS';
 const params = { name: newBlobName,
                  sDate:req.body.startDate,
                  expDate:req.body.expDate
              };

 // Make a GET request to the Azure Function endpoint
 const response = await axios.get(azureFunctionUrl, { params });

 // Log the response from the Azure Function
 console.log('Response from Azure Function:', response.data);

 x = await createDBObject(req.body, newBlobName);
 x['link']= response.data;

} catch (error) {
console.error('Error uploading file:', error);
res.status(500).send('Error uploading file.');}


// Add entry to cosmosDB
  try{
  await createItem(x);
  }

  catch(err){
    console.log(err)
  }
  //

  res.redirect("/")

});


module.exports = router;

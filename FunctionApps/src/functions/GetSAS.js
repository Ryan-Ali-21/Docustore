const { app } = require('@azure/functions');
const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential,  } = require("@azure/storage-blob");

require("dotenv").config();

app.http('GetSAS', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {


        try{

            const name = request.query.get('name') || await request.text() || 'world';
            const sDate = request.query.get('sDate') || await request.text();
            const expDate = request.query.get('expDate') || await request.text();

            const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
            if (!accountName) throw Error('Azure Storage accountName not found');

            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

             // Create a unique name for the container
        const containerName = 'quickstart';

        
        // Get a reference to a container
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        var test = "";
        
        
        let i = 1;
        let blobs = containerClient.listBlobsFlat();
        flag = false;
        for await (const blob of blobs) {
            if(name === blob.name){
                test = name;
                flag = true;
                break;
            }
        }
        
        //required for generating SAS token
        const sharedKeyCredential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.sharedKey);

        const blobClient = containerClient.getBlobClient(test);
       
        // Create a BlobSASPermissions object
        const permissions = new BlobSASPermissions();
        permissions.read = true;

       const startDate = new Date(sDate);
       const expiryDate = new Date(expDate);

       context.log(startDate);
       context.log(expiryDate);

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters({
        containerName: containerName,
        blobName: blobClient.name,
        permissions: permissions,
        startsOn: startDate,//new Date(Date.now() - 300 * 1000),
        expiresOn: expiryDate//new Date(Date.now() + 86400 * 1000),
    },sharedKeyCredential).toString();

    // Construct SAS URL
    const sasUrlold = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobClient.name}?${sasToken}`;
    const sasUrl = `https://docustore.azureedge.net/${containerName}/${blobClient.name}?${sasToken}`;


        context.log(sasUrl);

        if(flag ===true){
            return { body: `${sasUrl}`};
        }
        else
        return { body: `Hello, ${name}! Blob not found`};

       
        }
        catch(error){
            console.log(error);
        }
        context.log(`Http function processed request for url "${request.url}"`);

        
    }
});


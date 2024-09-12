/* 
Here is a Node.js script using the MongoDB Node.js driver that retrieves all documents from the queries collection in the LLMQL database, processes each document to change its format, and then updates the documents back in the collection.

DEPRECATED - this was a one time reformat for openai training format
*/


const { MongoClient, ObjectId } = require('mongodb');

async function updateDocuments() {
  const uri = 'mongodb://localhost:27017'; // Update with your MongoDB connection string if necessary
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const database = client.db('LLMQL');
    const collection = database.collection('queries');

    const documents = await collection.find({}).toArray();

    for (let doc of documents) {
      // Create the new messages structure
      const updatedDoc = {
        messages: [
          {
            role: 'user',
            content: doc.user,
          },
          {
            role: 'assistant',
            content: doc.system,
          },
        ],
      };

      // Remove the user and system fields from the original document
      delete doc.user;
      delete doc.system;

      // Assign the new messages structure to the original document
      doc.messages = updatedDoc.messages;

      // Now update the entire document in the collection
      await collection.replaceOne(
        { _id: doc._id },
        doc
      );
    }

    console.log('Documents have been updated successfully.');
  } catch (error) {
    console.error('Error updating documents:', error);
  } finally {
    await client.close();
  }
}

updateDocuments();

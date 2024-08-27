require('dotenv').config();
const OpenAI = require('openai');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs')


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const provider = 'openai';
//const model = 'gpt-4o-mini'

module.exports = {
    uploadFile: async function() {
        const filePath = path.join('./data', 'finetune.jsonl');
        console.log(filePath)


        let result = await openai.files.create({ file: fs.createReadStream(filePath), purpose: 'fine-tune' });

          console.log(result);
          return result;
    },

    createJob: async function(filename) {
        const result = await openai.fineTuning.jobs.create({ training_file: filename, model: 'gpt-4o-mini-2024-07-18' });        
        console.log(result);
        return result;
    }
}

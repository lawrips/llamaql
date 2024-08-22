require('dotenv').config();
const OpenAI = require('openai');
const { MongoClient } = require('mongodb');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});





const provider = 'openai';
const model = 'gpt-4o-mini'

module.exports = {
    create: function() {
        openai.files.create(
            file=open("./mydata.jsonl", "rb"),
            purpose="fine-tune"
          )
        
    },

    fineTune: function() {
        client.fine_tuning.jobs.create(
            training_file="file-abc123", 
            model="gpt-4o-mini"
          )
        
    }
}

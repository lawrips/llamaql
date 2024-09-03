//import { finetune } from '@/lib/services/finetune';
const finetune = require('../../../lib/services/finetune')
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(request) {
  let file = await finetune.uploadFile();
  let result = await finetune.createJob(file.id);
  
  return new Response(
      JSON.stringify(
        {
          status: 'ok'
        }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  
}

export async function GET(request) {
// List 10 fine-tuning jobs
let page = await openai.fineTuning.jobs.list({ limit: 10 });

return new Response(
  JSON.stringify(
      page.data.map(i =>{return {name: i.fine_tuned_model, status: i.status}}),
    ), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});
}

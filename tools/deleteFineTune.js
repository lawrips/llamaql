const { OpenAI } = require('openai');

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this environment variable
});

async function deleteAllFineTunes() {
  try {
    // Get all fine-tunes
    const fineTunes = await openai.fineTuning.jobs.list();

    // Delete each fine-tune
    for (const fineTune of fineTunes.data) {
        console.log(`Deleting fine-tune: ${fineTune.fine_tuned_model}`);
      await openai.models.delete(fineTune.fine_tuned_model);
    }

    console.log('All fine-tunes have been deleted.');
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAllFineTunes();
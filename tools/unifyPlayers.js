const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const dataDir = path.join(__dirname, '..', 'data');
const outputFile = path.join(__dirname, 'player_stats.csv');

// Define all possible headers
const allHeaders = [
  'Year', 'Position', 'Player',
  'PASS_CMP', 'PASS_ATT', 'PASS_PCT', 'PASS_YDS', 'PASS_Y/A', 'PASS_TD', 'PASS_INT', 'PASS_SACKS',
  'RUSH_ATT', 'RUSH_YDS', 'RUSH_Y/A', 'RUSH_LG', 'RUSH_20+', 'RUSH_TD',
  'REC_REC', 'REC_TGT', 'REC_YDS', 'REC_Y/R', 'REC_LG', 'REC_20+', 'REC_TD',
  'FL', 'G', 'FPTS', 'FPTS/G', 'ROST'
];

// Fields that should be converted to numbers
const numericFields = [
  'PASS_CMP', 'PASS_ATT', 'PASS_YDS', 'PASS_TD', 'PASS_INT', 'PASS_SACKS',
  'RUSH_ATT', 'RUSH_YDS', 'RUSH_LG', 'RUSH_20+', 'RUSH_TD',
  'REC_REC', 'REC_TGT', 'REC_YDS', 'REC_LG', 'REC_20+', 'REC_TD',
  'FL', 'G'
];

// Fields that should be converted to floats
const floatFields = ['PASS_PCT', 'PASS_Y/A', 'RUSH_Y/A', 'REC_Y/R', 'FPTS', 'FPTS/G'];

// Setup CSV writer
const csvWriter = createCsvWriter({
  path: outputFile,
  header: allHeaders.map(header => ({ id: header, title: header }))
});

// Function to convert string to number, removing commas
function toNumber(value) {
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return value || 0;
}

// Function to convert string to float
function toFloat(value) {
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return value || 0;
}

// Function to convert percentage to decimal
function toDecimal(value) {
  if (typeof value === 'string' && value.endsWith('%')) {
    return parseFloat(value) / 100 || 0;
  }
  return value || 0;
}

// Function to read and process CSV files
async function processFiles() {
  const files = fs.readdirSync(dataDir).filter(file => /^\d{4}_[A-Z]{2}\.csv$/.test(file));
  let allData = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const [year, position] = file.split('_');

    const data = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Add Year and Position to each row
          data.Year = parseInt(year);
          data.Position = position.replace('.csv', '');
          
          // Convert numeric fields
          numericFields.forEach(field => {
            data[field] = toNumber(data[field]);
          });

          // Convert float fields
          floatFields.forEach(field => {
            data[field] = toFloat(data[field]);
          });

          // Convert ROST to decimal
          data.ROST = toDecimal(data.ROST);

          // Ensure all fields are present, defaulting to 0 for numeric fields
          allHeaders.forEach(field => {
            if (!(field in data)) {
              if (numericFields.includes(field) || floatFields.includes(field)) {
                data[field] = 0;
              } else {
                data[field] = null;
              }
            }
          });

          results.push(data);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    allData = allData.concat(data);
  }

  // Write combined data to output file
  await csvWriter.writeRecords(allData);
  console.log(`Combined data written to ${outputFile}`);
}

// Run the script
processFiles().catch(console.error);
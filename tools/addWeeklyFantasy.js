const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// User-specified constants
const SOURCE_DIR = '/users/lawri/Downloads/nfl';
const WEEK_NUMBER = 6;

class FantasyFootballStatsProcessor {
    constructor() {
        this.destDir = SOURCE_DIR;
        this.playerTypes = {
          QB: '*_Fantasy_Football_Statistics_QB*.csv',
          WR: '*_Fantasy_Football_Statistics_WR*.csv',
          RB: '*_Fantasy_Football_Statistics_RB*.csv',
          TE: '*_Fantasy_Football_Statistics_TE*.csv',
          DST: '*_Fantasy_Football_Statistics_DST*.csv'
        };
        this.destFiles = {
          QB: '2024_weekly_qb.csv',
          WR: '2024_weekly_wr.csv',
          RB: '2024_weekly_rb.csv',
          TE: '2024_weekly_te.csv',
          DST: '2024_weekly_dst.csv'
        };
        this.headers = {
          QB: ['Week', 'Player', 'PASS_CMP', 'PASS_ATT', 'PASS_PCT', 'PASS_YDS', 'PASS_Y/A', 'PASS_TD', 'PASS_INT', 'SACKS', 'RUSH_ATT', 'RUSH_YDS', 'RUSH_TD', 'FUMBLES LOST', 'GAMES', 'FPTS', 'FPTS/G', 'ROST'],
          WR: ['Week', 'Player', 'REC_REC', 'REC_TGT', 'REC_YDS', 'REC_Y/R', 'REC_LG', 'REC_20+', 'REC_TD', 'RUSH_ATT', 'RUSH_YDS', 'RUSH_TD', 'FUMBLES LOST', 'GAMES', 'FPTS', 'FPTS/G', 'ROST'],
          RB: ['Week', 'Player', 'RUSH_ATT', 'RUSH_YDS', 'RUSH_Y/A', 'RUSH_LG', 'RUSH_20+', 'RUSH_TD', 'REC_REC', 'REC_TGT', 'REC_YDS', 'REC_Y/R', 'REC_TD', 'FUMBLES LOST', 'GAMES', 'FPTS', 'FPTS/G', 'ROST'],
          TE: ['Week', 'Player', 'REC_REC', 'REC_TGT', 'REC_YDS', 'REC_Y/R', 'REC_LG', 'REC_20+', 'REC_TD', 'RUSH_ATT', 'RUSH_YDS', 'RUSH_TD', 'FUMBLES LOST', 'GAMES', 'FPTS', 'FPTS/G', 'ROST'],
          DST: ['Week', 'Player', 'SACK', 'INT', 'FUMBLES REC', 'FUMBLES FOR', 'DEF TD', 'SFTY', 'SPC TD', 'GAMES', 'FPTS', 'FPTS/G', 'ROST']
        };
      }
    

  async processFiles() {
    for (const [playerType, filePattern] of Object.entries(this.playerTypes)) {
      const sourceFiles = await this.getSourceFiles(filePattern);
      for (const sourceFile of sourceFiles) {
        await this.processFile(playerType, sourceFile);
      }
    }
  }

  async getSourceFiles(filePattern) {
    const files = await fs.readdir(SOURCE_DIR);
    return files.filter(file => this.matchesPattern(file, filePattern)).map(file => path.join(SOURCE_DIR, file));
  }

  matchesPattern(filename, pattern) {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regexPattern.test(filename);
  }

  async processFile(playerType, sourceFile) {
    const destFile = path.join(this.destDir, this.destFiles[playerType]);
    const existingData = await this.readExistingData(destFile);
    const newData = await this.readSourceFile(sourceFile, playerType);

    const updatedData = this.mergeData(existingData, newData);
    await this.writeData(destFile, updatedData, playerType);
  }

  async readExistingData(destFile) {
    const existingData = new Map();
    try {
      const fileContent = await fs.readFile(destFile, 'utf8');
      const rows = await this.parseCsv(fileContent);
      for (const row of rows) {
        const key = `${row.Week}-${row.Player}`;
        existingData.set(key, row);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    return existingData;
  }

  async readSourceFile(sourceFile, playerType) {
    const fileContent = await fs.readFile(sourceFile, 'utf8');
    const rows = await this.parseCsv(fileContent);

    // Filter out empty rows
    const nonEmptyRows = rows.filter(row => this.isRowNotEmpty(row));

    return nonEmptyRows.map(row => this.processRow(playerType, row));
  }

  getHeaderMapping(playerType) {
    const commonMappings = {
      Player: 'Player',
      GAMES: 'G',
      FPTS: 'FPTS',
      'FPTS/G': 'FPTS/G',
      ROST: 'ROST'
    };

    const specificMappings = {
      QB: {
        PASS_CMP: 'CMP',
        PASS_ATT: 'ATT',
        PASS_PCT: 'PCT',
        PASS_YDS: 'YDS',
        'PASS_Y/A': 'Y/A',
        PASS_TD: 'TD',
        PASS_INT: 'INT',
        SACKS: 'SACKS',
        RUSH_ATT: 'ATT_2',
        RUSH_YDS: 'YDS_2',
        RUSH_TD: 'TD_2',
        'FUMBLES LOST': 'FL'
      },
      WR: {
        REC_REC: 'REC',
        REC_TGT: 'TGT',
        REC_YDS: 'YDS',
        'REC_Y/R': 'Y/R',
        REC_LG: 'LG',
        'REC_20+': '20+',
        REC_TD: 'TD',
        RUSH_ATT: 'ATT',        // Corrected mapping
        RUSH_YDS: 'YDS_2',      // Second 'YDS' field
        RUSH_TD: 'TD_2',        // Second 'TD' field
        'FUMBLES LOST': 'FL'
      },
      RB: {
        RUSH_ATT: 'ATT',
        RUSH_YDS: 'YDS',
        'RUSH_Y/A': 'Y/A',
        RUSH_LG: 'LG',
        'RUSH_20+': '20+',
        RUSH_TD: 'TD',
        REC_REC: 'REC',
        REC_TGT: 'TGT',
        REC_YDS: 'YDS_2',
        'REC_Y/R': 'Y/R',
        REC_TD: 'TD_2',
        'FUMBLES LOST': 'FL'
      },
      TE: {
        REC_REC: 'REC',
        REC_TGT: 'TGT',
        REC_YDS: 'YDS',
        'REC_Y/R': 'Y/R',
        REC_LG: 'LG',
        'REC_20+': '20+',
        REC_TD: 'TD',
        RUSH_ATT: 'ATT',        // Assuming TE follows similar pattern
        RUSH_YDS: 'YDS_2',
        RUSH_TD: 'TD_2',
        'FUMBLES LOST': 'FL'
      },
      DST: {
        SACK: 'SACK',
        INT: 'INT',
        'FUMBLES REC': 'FR',
        'FUMBLES FOR': 'FF',
        'DEF TD': 'TD',
        SFTY: 'SFTY',
        'SPC TD': 'TD_2'
      }
    };

    return { ...commonMappings, ...specificMappings[playerType] };
  }


  processRow(playerType, row) {
    const processedRow = { Week: WEEK_NUMBER.toString() };
    const headerMapping = this.getHeaderMapping(playerType);

    for (const [destHeader, sourceHeader] of Object.entries(headerMapping)) {
      processedRow[destHeader] = row[sourceHeader] || '';
    }
    return processedRow;
  }

  mergeData(existingData, newData) {
    for (const row of newData) {
      const key = `${row.Week}-${row.Player}`;
      existingData.set(key, row);
    }
    return Array.from(existingData.values());
  }

  async writeData(destFile, data, playerType) {
    const csvWriter = createCsvWriter({
      path: destFile,
      header: this.headers[playerType].map(header => ({ id: header, title: header })),
      append: false
    });
    await csvWriter.writeRecords(data);
  }

  async parseCsv(fileContent) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headerCounts = {};
      const parser = csv({
        mapHeaders: ({ header, index }) => {
          if (headerCounts[header]) {
            headerCounts[header]++;
            return `${header}_${headerCounts[header]}`;
          } else {
            headerCounts[header] = 1;
            return header;
          }
        }
      });
      parser.on('data', (data) => {
        // Check if the row is not empty
        if (this.isRowNotEmpty(data)) {
          results.push(data);
        }
      });
      parser.on('end', () => resolve(results));
      parser.on('error', (error) => reject(error));
      parser.write(fileContent);
      parser.end();
    });
  }

  isRowNotEmpty(row) {
    // Check if at least one value in the row is non-empty
    return Object.values(row).some(value => value && value.trim() !== '');
  }
}

async function main() {
  const processor = new FantasyFootballStatsProcessor();
  await processor.processFiles();
  console.log('Processing complete!');
}

main().catch(console.error);

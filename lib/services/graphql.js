const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
const { MongoClient } = require('mongodb');
// MongoDB connection URL and Database Name
const url = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(url);


const apollo = new ApolloClient({
  uri: 'https://spacex-production.up.railway.app/',
  cache: new InMemoryCache(),
});




module.exports = {
  // Function to execute MongoDB query
  execute: async function (query, filter, limit, order, dataPath) {
    let result = await apollo.query({
      query: query,
      variables: {
        limit: limit,
        order: order,
        filter: filter, // Pass the filter condition as a variable
      },
    });

    // Apply the filter in-memory using the provided condition
    const dataToFilter = result.data[dataPath];
    console.log('got total results:')
    console.log(result.data.launches.length);

    //const filteredData = dataToFilter.filter(item => eval(`item.${filter}`));
    const filteredData = filterData(dataToFilter, [filter]);

    return filteredData;


  },

  getAll: async function (dbName) {
    await client.connect();
    const db = client.db(dbName);
    const colection = db.collection('queries');
    let queries = await colection.find({}).toArray();

    return queries;
  }
}

function filterData(data, filters) {
  return data.filter(item => {
    return filters.every(filter => {
      const [path, operator, value] = filter.split(" "); 
      const accessedValue = path.split(".").reduce((obj, key) => obj?.[key], item);

      switch (operator) {
        case "=": 
        case "==":
          return accessedValue === value;
        case "<":
          return accessedValue < parseFloat(value);
        case ">":
          return accessedValue > parseFloat(value);
        case "<=":
          return accessedValue <= parseFloat(value);
        case ">=":
          return accessedValue >= parseFloat(value);
        case "!=":
          return accessedValue !== value;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    });
  });
}
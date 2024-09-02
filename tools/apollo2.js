const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');

const headers = {
  'x-client-id': '5ed1175bad06853b3aa1e492',
  'x-app-id': '623998b2c35130073829b2d2',
};


const httpLink = createHttpLink({
  uri: 'https://api.chargetrip.io/graphql', // Replace with your actual endpoint
  headers : {
    'x-client-id': '66d3aef653d8874f0c67bd19',
    'x-app-id': '66d3aef653d8874f0c67bd1b',
  }
});
const client = new ApolloClient({
  link: httpLink, // Use the httpLink with headers
  cache: new InMemoryCache(),
});

const GET_VEHICLES = gql`
  query vehicleListAll ($page: Int = 0, $size: Int = 100, $search: String = "") {
    vehicleList (
    page: $page, 
    size: $size,     
    search: $search, 

    ){
      id
      naming {
        make
        model
        version
        edition
        chargetrip_version
      }
      # ... (rest of the fields from your schema)
      range {
        chargetrip_range {
          best
          worst
        }
      }
    }
  }
`;

// Filter criteria (range >= 200 miles)
const filterCriteria = {
  dataPath: "vehicleList",
  field: "range.chargetrip_range.worst", // Use the worst-case range for filtering
  operator: "<",
  value: 200
};

function doQuery(query, filter) {
  // Construct the filter condition dynamically
  const filterCondition = `${filter.field} ${filter.operator} ${filter.value}`;

  client.query({
    query: query,
  })
  .then(result => {
    // Apply the filter in-memory using the provided condition
    const dataToFilter = result.data[filterCriteria.dataPath]; 
    console.log('number of original records: ' + dataToFilter.length)
    const filteredData = dataToFilter.filter(item => eval(`item.${filterCondition}`)); 

    console.log("Filtered Vehicles with Range >= 200 miles:");
    console.log("number of records: " + filteredData.length)
  console.log(filteredData.map((i) => {return { "name": i.naming.make + ': ' + i.naming.model, "range": i.range.chargetrip_range}})); 
  })
  .catch(error => {
    console.error("Error fetching vehicle data:", error);
  });
}

doQuery(GET_VEHICLES, filterCriteria);
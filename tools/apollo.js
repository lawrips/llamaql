const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');

const client = new ApolloClient({
  uri: 'https://spacex-production.up.railway.app/',
  cache: new InMemoryCache(),
});

const GET_LAUNCHES = gql`
 query GetLaunches($limit: Int, $order: String) {
    launches(limit: $limit, order: $order) {
      links {
        article_link
        flickr_images
        video_link
      }
      launch_site {
        site_name
      }
      launch_success
      launch_year
      rocket {
        rocket_name
        rocket_type
        rocket {
          company
          cost_per_launch
          country
          mass {
            lb
          }
        }
      }
      upcoming
    }
  }

 
`;

// Sample JSON payload with filter criteria
const filterCriteria = {
    dataPath: "launches", 
    field: "rocket.rocket.mass.lb",
    value: 100000,
    operator: "<"
  };
  

function doQuery(query, filter, limit, order) {
  // Construct the filter condition dynamically
  const filterCondition = `${filterCriteria.field} ${filterCriteria.operator} ${filterCriteria.value}`;
  
  client.query({
    query: query,
    variables: {
      limit: limit, 
      order: order,
      filter: filterCondition, // Pass the filter condition as a variable
    },
  })
  .then(result => {
    // Apply the filter in-memory using the provided condition
    const dataToFilter = result.data[filterCriteria.dataPath]; 

    const filteredData = dataToFilter.filter(item => eval(`item.${filterCondition}`)); 
  
    console.log("Filtered:");
    console.log(result.data.launches.length); 
    console.log(filteredData.length)
    console.log(filteredData)
  })
  .catch(error => {
    console.error("Error fetching launch data:", error);
  });
}

doQuery(GET_LAUNCHES, filterCriteria, 100, "launch_year");

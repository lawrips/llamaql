const jsonFormat = require('./example.json')


module.exports = {
    instructions : `***INSTRUCTIONS***
                  Generate MongoDB queries and format the returned data for nfl player stats queries workouts. ONLY RETURN THE MONGO QUERY IN THE RESPONSE (no additional formatting or context).
                  I will give you a natural language query which you should respond with a MongoDB query that would generate the expected response from MongoDB.
                  ***DETAILS***:
                      * Whenever you use dates, use standard ISO formatted dates (e.g. 2021-11-20) - do not use the Date() object
                      * Assume "today" is 2024-07-31. If no date or year is specified in the user's query, assume they are referring to 2023
                      * NEVER include any markdown or formatting in ANY response. It is critical that you respect this instruction.
                      * Do not hallucinate column names. if it is not in the sample json format below, then it's not available
                      * ALWAYS respect instructions for ranking / ordering and specific requests of what to display.
                      * Do not put comments in JSON as this will fail
                      * NEVER EVER send content containing the character “ or ” (curly quotation marks).
                      * NEVER surround the entire query with quotes - just give the plan json
                  ***SAMPLE DATA***
                  JSON Format:\n${JSON.stringify(jsonFormat, null, 2)}\n
                  Example user and MongoDB queries are shown in the JSON below. with  the natural language user query and 
                the corresponding mongo queries to accomplish these questions:\n`

}
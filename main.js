function parseLine(line) {
    var gdpDict = {};
    for(var i = 1960; i<2017; i++){
        gdpDict[i] = Number(line[i]);
    }

    return {
        countryName: line["Country Name"],
        countryCode: line["Country Code"],
        GDP: gdpDict
    };
}

// Load data from csv
// Call callbacks to generate images
d3.csv("gdpGood.csv", parseLine, function(err, data) {
    console.log(data);
});
var gdpData;
var satelliteData;
var topTenData = [];

function parseGdpRow(row) {
    var gdpDict = {};
    for(var i = 1960; i<2017; i++){
        gdpDict[i] = Number(row[i]);
    }

    return {
        countryName: row["Country Name"],
        countryCode: row["Country Code"],
        GDP: gdpDict
    };
}

function gdpCallback(err, data) {
    gdpData = data;
}

function parseSatelliteRow(row) {
    var launchMass;
    var orbitsPerDay;
    var perigee, apogee, altitude;
    var country;
    if (row["Country of Operator/Owner"] == "USA") {
        country = "United States";
    } else if (row["Country of Operator/Owner"] == "Russia") {
        country = "Russian Federation";
    } else {
        country = row["Country of Operator/Owner"];
    }
    if (row["Launch Mass (kg.)"] > 0) {
        launchMass = row["Launch Mass (kg.)"];
    } else {
        launchMass = "unknown";
    }
    if (row["Period (minutes)"].includes("days")) {
        orbitsPerDay = 1/(row["Period (minutes)"].substring(0,row["Period (minutes)"].length - 5));
    } else {
        orbitsPerDay = row["Period (minutes)"]/1440;
    }
    perigee = Number(row["Perigee (km)"].replace(",",""));
    apogee = Number(row["Apogee (km)"].replace(",",""));
    altitude = (perigee + apogee)/2;

    return {
        name: row["Current Official Name of Satellite"],
        countryOperator: country, //gdp
        countryContractor: row["Country of Contractor"],
        user: row["Users"],
        purpose: row["Purpose"],
        altitude: altitude,
        launchMass: launchMass,
        launchDate: row["Date of Launch"],
        orbitsPerDay: orbitsPerDay
    }
}

// sorts byCountry by number of satellites, most to least
function customCompare(a,b) {
    if (a.values.length < b.values.length) {
        return 1;
    }
    if (a.values.length > b.values.length) {
        return -1;
    }
    return 0;
}

function satelliteCallback(err, data) {
    satelliteData = data;
    // console.log(gdpData);
    // console.log(satelliteData);
    var byCountry = d3.nest()
        .key(function(d){return d.countryOperator;})
        .entries(data);
    byCountry = byCountry.sort(customCompare);

    // extracting the ten countries with the most satellites
    var idx = 0;
    var count = 0;
    var topTen = [];
    var totalSatellites = 0;
    while (count < 10) {
        if (byCountry[idx].key !== "Multinational" && byCountry[idx].key !== "ESA") {
            topTen.push(byCountry[idx]);
            count++;
            totalSatellites += byCountry[idx].values.length;
        }
        idx++;
    }
    console.log(topTen);

    // organizing top ten country data for the gdp bar chart
    var thisCountryData;
    var acc = 0;
    for (var i=0; i < 10; i++) {
        thisCountryData = {
            name: topTen[i].key,
            numberSatellites: topTen[i].values.length,
            proportionSatellites: (topTen[i].values.length/totalSatellites),
            accumulateSatellites: acc,
            gdp: gdpData.find(x => x.countryName == topTen[i].key).GDP[2016]
        };
        topTenData.push(thisCountryData);
        acc += topTen[i].values.length/totalSatellites;
    }
    console.log(topTenData);

    var svg = d3.select("#gdpBars");
    var padding = 10;
        margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = document.getElementById("left").offsetWidth - margin.left - margin.right,
        height = document.getElementById("left").offsetHeight - margin.top - margin.bottom;
    var x = d3.scaleLinear().rangeRound([0, width]);
        y = d3.scaleLinear().rangeRound([height, 0]);
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    x.domain([0, 1]);
    y.domain([0, d3.max(topTenData, function(d) { return d.gdp; })]);

    g.selectAll(".bar")
        .data(topTenData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.accumulateSatellites); })
        .attr("y", function(d) { return 0; })
        .attr("width", function(d) {return x(d.proportionSatellites);})
        .attr("height", function(d) { return height - y(d.gdp); });


}

// Load data from csv
// Call callbacks to generate images
d3.csv("gdpGood.csv", parseGdpRow, gdpCallback);
d3.csv("satellites.csv", parseSatelliteRow, satelliteCallback);
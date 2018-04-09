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
    var massDiam;
    if (row["Country of Operator/Owner"] == "USA") {
        country = "United States";
    } else if (row["Country of Operator/Owner"] == "Russia") {
        country = "Russian Federation";
    } else {
        country = row["Country of Operator/Owner"];
    }
    if (row["Launch Mass (kg.)"] > 0) {
        launchMass = row["Launch Mass (kg.)"].replace("+","").replace(",","");
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

    if (launchMass == "unknown") {
        massDiam = 7;
    } else if (Number(launchMass)>10000) {
        massDiam = 11;
    } else if (Number(launchMass) > 5000) {
        massDiam = 9;
    } else if (Number(launchMass) > 1000) {
        massDiam = 7.5;
    } else if (Number(launchMass) > 500) {
        massDiam = 6;
    } else if (Number(launchMass) > 100) {
        massDiam = 4.5;
    } else {
        massDiam = 3;
    }

    return {
        name: row["Current Official Name of Satellite"],
        countryOperator: country, //gdp
        countryContractor: row["Country of Contractor"],
        user: row["Users"],
        purpose: row["Purpose"],
        altitude: altitude,
        launchMass: launchMass,
        massDiam: massDiam,
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
    // console.log(topTen);

    // organizing top ten country data for the gdp bar chart
    var thisCountryData;
    var acc = 0;
    for (var i=0; i < 10; i++) {
        thisCountryData = {
            name: topTen[i].key,
            numberSatellites: topTen[i].values.length,
            proportionSatellites: (topTen[i].values.length/totalSatellites),
            accumulateSatellites: acc,
            gdp: gdpData.find(x => x.countryName == topTen[i].key).GDP[2016],
            satellites: topTen[i].values
        };
        topTenData.push(thisCountryData);
        acc += topTen[i].values.length/totalSatellites;
    }
    // console.log(topTenData);

    var svg = d3.select("#gdpBars");
    var padding = 0;
        margin = {top: 0, right: 20, bottom: 20, left: 20},
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

    drawSatellites(topTenData, x);
}

function drawSatellites(data, x_scale) {
    console.log(data);
    // for each country
    var x_start, x_end, x_coord, y_coord;
    var y_scale = d3.scaleLinear().rangeRound([1800,0]);
    y_scale.domain([0, d3.max(data, function(d) { return d.altitude; })]);
    data.forEach(element => {
        x_start = x_scale(element.accumulateSatellites);
        x_end = x_scale(element.accumulateSatellites + element.proportionSatellites);
        element.satellites.forEach(satellite => {
            x_coord = Math.random() * (x_end-x_start);
            y_coord = y_scale(satellite.altitude);
        });
    });
}

// Load data from csv
// Call callbacks to generate images
d3.csv("gdpGood.csv", parseGdpRow, gdpCallback);
d3.csv("satellites.csv", parseSatelliteRow, satelliteCallback);
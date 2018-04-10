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
    altitude = (Number(perigee) + Number(apogee))/2;

    if (launchMass == "unknown") {
        massDiam = 15;
    } else if (Number(launchMass)>10000) {
        massDiam = 21;
    } else if (Number(launchMass) > 5000) {
        massDiam = 18;
    } else if (Number(launchMass) > 1000) {
        massDiam = 15;
    } else if (Number(launchMass) > 500) {
        massDiam = 12;
    } else if (Number(launchMass) > 100) {
        massDiam = 9;
    } else {
        massDiam = 6;
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

    var svgBars = d3.select("#gdpBars");
    var padding = 0;
        margin = {top: 0, right: 20, bottom: 20, left: 20},
        width = document.getElementById("left").offsetWidth - margin.left - margin.right,
        height = document.getElementById("left").offsetHeight - margin.top - margin.bottom;
    var x = d3.scaleLinear().rangeRound([0, width]);
        y = d3.scaleLinear().rangeRound([height, 0]);
    var g = svgBars.append("g")
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
    var svgSat = d3.select("#satellites");
    var x_start, x_end, x_coord, y_coord;
    var y_scale = d3.scaleLinear()
            .rangeRound([1800,0]);
    y_scale.domain([d3.max(data, function(d) { 
        return d3.max(d.satellites, function(s) {
            return s.altitude;
        });
     }),0]);
    data.forEach(element => {
        x_start = x_scale(element.accumulateSatellites);
        x_end = x_scale(element.accumulateSatellites + element.proportionSatellites);
        element.satellites.forEach(satellite => {
            x_coord = Math.random() * (x_end-x_start);
            y_coord = y_scale(satellite.altitude);
            // console.log("altitude="+satellite.altitude);
            // console.log("y_coord="+ y_coord);
            // console.log(satellite.massDiam/2);
            if(satellite.user == "Commercial"){
                svgSat.append("circle")
                    .attr("cx", x_coord)
                    .attr("cy", y_coord)
                    .attr("r", (satellite.massDiam/2))
                    .attr("fill", "red")
                    .attr("stroke", "red");
                    //we can add attributes and styles here
            }else if(satellite.user == "Civil"){
//                 <polygon fill="yellow" stroke="blue" stroke-width="2"
// 3    points="05,30
// 4            15,10
// 5            25,30" />
                var x1 = x_coord-(satellite.massDiam/2);
                var h = Math.sqrt((satellite.massDiam*satellite.massDiam)-((satellite.massDiam/2)*(satellite.massDiam/2)));
                var y1 = y_coord+(h/2);
                var x2 = x_coord;
                var y2 = y_coord-(h/2);
                var x3 = x_coord+(satellite.massDiam/2);
                var y3 = y_coord+(h/2);
                // console.log("x1="+ x1);
                var lineData = [{"x":x1, "y":y1}, {"x":x2, "y":y2}, {"x":x3, "y":y3}];
                var lineFunction = d3.line()
                    .x(function(d) { return d.x; })
                    .y(function(s) { return s.y; });
                svgSat.append("path")
                    .attr("d", lineFunction(lineData));
            }
        });
    });
}

// Load data from csv
// Call callbacks to generate images
d3.csv("gdpGood.csv", parseGdpRow, gdpCallback);
d3.csv("satellites.csv", parseSatelliteRow, satelliteCallback);
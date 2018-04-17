var gdpData;
var satelliteData;
var topTenData = [];
var byCountry;

//parse country codes for flags in tooltips
var codes;
d3.json("countrycodes.json", function (data) {
    codes = data;
});

// converts 3 letter country code to 2 letter country code
function getCountryCode2(countryCode3) {
    return codes[0][countryCode3];
}

// sums an array
function arrSum(total, num) {
    return total + num;
}

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
    var yearSlider = document.getElementById("yearslider");
    var date = row["Date of Launch"];
    var year = date.substring(date.length-2, date.length);
    var launchMass;
    var orbitsPerDay;
    var perigee, apogee, altitude;
    var country;
    var massDiam;
    var altitudeCategory;
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

    if (altitude < 300) {
        altitudeCategory = 0;
    } else if (altitude < 400) {
        altitudeCategory = 1;
    } else if (altitude < 500) {
        altitudeCategory = 2;
    } else if (altitude < 600) {
        altitudeCategory = 3;
    } else if (altitude < 700) {
        altitudeCategory = 4;
    } else if (altitude < 800) {
        altitudeCategory = 5;
    } else if (altitude < 900) {
        altitudeCategory = 6;
    } else if (altitude < 1000) {
        altitudeCategory = 7;
    } else if (altitude < 2000) {
        altitudeCategory = 8;
    } else if (altitude < 10000) {
        altitudeCategory = 9;
    } else if (altitude < 20000) {
        altitudeCategory = 10;
    } else if (altitude < 30000) {
        altitudeCategory = 11;
    } else if (altitude < 40000) {
        altitudeCategory = 12;
    } else if (altitude < 50000) {
        altitudeCategory = 13;
    } else {
        altitudeCategory = 14;
    }
    return {
        name: row["Current Official Name of Satellite"],
        series: row["Series"],
        countryOperator: country, // used for gdp
        countryContractor: row["Country of Contractor"],
        user: row["Users"],
        purpose: row["Purpose"],
        altitude: altitude,
        altitudeCategory: altitudeCategory,
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

// checkmark listener
function changeFunc(){
    d3.select("#satellites").selectAll("circle").remove();
    d3.select("#satellites").selectAll("path").remove();
    d3.select("#satellites").selectAll("rect").remove();
    drawBars(satelliteData);
}

// adjusts both svgs on slider input
function sliderHandler() {
    var yearSlider = document.getElementById("yearslider");
    var sliderLabel = document.getElementById("sliderlabel");
    sliderLabel.innerHTML =  "&#8672;     SELECT YEAR RANGE (1974-"+ yearSlider.value +")";
    drawBars(satelliteData);   
}

// implement a sticky header, adapted from: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sticky_header
window.onscroll = function() { stickHeadFunc() };

function stickHeadFunc(){
    var header = document.getElementById("legendbar");
    if (window.pageYOffset >= 204){  
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}

function satelliteCallback(err, data) {
    satelliteData = data;
    drawBars(satelliteData);

    // define checkmark listeners
    commCheck = document.getElementById("commercialCheck");
    commCheck.onchange = function(){ changeFunc(); };
    civilCheck = document.getElementById("civilCheck");
    civilCheck.onchange = function(){ changeFunc(); };
    militaryCheck = document.getElementById("militaryCheck");
    militaryCheck.onchange = function(){ changeFunc(); };
    governmentCheck = document.getElementById("governmentCheck");
    governmentCheck.onchange = function(){ changeFunc(); };
    multipleCheck = document.getElementById("multipleCheck");
    multipleCheck.onchange = function(){ changeFunc(); };
}

function drawBars(satelliteData) {
    // extracting the ten countries with the most satellites
    var thisData = [];
    var yearSlider = document.getElementById("yearslider");
    for (var i=0; i<satelliteData.length; i++) {
        var date = satelliteData[i].launchDate;
        var year = date.substring(date.length-2, date.length);
        var valid = false;
        if (yearSlider.value >= 2000) {
            if ((year <= yearSlider.value.toString().substring(2,4)) || year >= 74 || year == 0)  {
                valid = true;    
            }
        } else if (year >=88 && year <= yearSlider.value.toString().substring(2,4)) {
            valid = true;
        }
        if (valid) {
            thisData.push(satelliteData[i]);
        }
    }
    byCountry = d3.nest()
        .key(function(d){ return d.countryOperator;})
        .entries(thisData);
    byCountry = byCountry.sort(customCompare);

    var idx = 0;
    var count = 0;
    var topTen = [];
    var bound = Math.min(10, byCountry.length);
    while (count < bound && idx < byCountry.length) {
        if (byCountry[idx].key !== "Multinational" && byCountry[idx].key !== "ESA" && byCountry[idx].key.indexOf('/') <= -1) {
            topTen.push(byCountry[idx]);
            count++;
        }
        idx++;
    }

    // calculate total satellites
    var totalSatellites = 0;
    for (var i=0; i < count; i++) {
        totalSatellites += topTen[i].values.length;
    };
    topTenData = [];
    // organizing top ten country data for the gdp bar chart
    var thisCountryData;
    var acc = 0;
    var colors = ["#7f2962", "#ac1e4e", "#ef4351", "#f79a62", "#fcd017", "#c0cf2f", "#5eb182", "#50b4ba", "#007ec3", "#3a4ea1", "#c1c1c1"];
    for (var i=0; i < count; i++) {
        thisCountryData = {
            name: topTen[i].key,
            numberSatellites: topTen[i].values.length,
            proportionSatellites: (topTen[i].values.length/totalSatellites),
            accumulateSatellites: acc,
            gdp: (gdpData.find(x => x.countryName == topTen[i].key).GDP[document.getElementById("yearslider").value]),
            satellites: topTen[i].values, 
            color: colors[i]
        };
        topTenData.push(thisCountryData);
        acc += topTen[i].values.length/totalSatellites;
    }

    // clears any previously drawn figures
    d3.select("#gdpbars").selectAll("rect").remove();
    d3.select("#gdpbars").selectAll("g").remove();
    d3.select("#satellites").selectAll("circle").remove();
    d3.select("#satellites").selectAll("path").remove();
    d3.select("#satellites").selectAll("rect").remove();
    
    var svgBars = d3.select("#gdpbars");
    var padding = 0,
        margin = {top: 0, right: 20, bottom: 20, left: 100},
        width = 1000,
        height = 800;
    var x = d3.scaleLinear().range([0, width]);
        y = d3.scaleLinear().range([height, 0]);
    var g = svgBars.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var svgDim = svgBars.node().getBoundingClientRect();
    x.domain([0, 1]);
    y.domain([0, d3.max(topTenData, function(d) { return d.gdp; })]);
    g.selectAll(".bar")
        .data(topTenData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.accumulateSatellites); })
        .attr("y", function(d) { return 0; })
        .attr("width", function(d) { return x(d.proportionSatellites);})
        .attr("height", function(d) { return height - y(d.gdp) + 50; })
        .attr("fill", function(d) { return d.color; })
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            var xPosition = document.getElementById("content").offsetWidth - (parseFloat(d3.select(this).attr("x"))) - (((parseFloat(d3.select(this).attr("width")))) / 2) - 200;
            var yPosition = document.getElementById("satdiv").offsetHeight;
            d3.select("#bartooltip")
                .style("right", xPosition + "px")
                .style("top", yPosition + "px")
            d3.select("#country")
                .text(d.name);
            d3.select("#flag-bar")
                .attr("src",  function() { 
                    var code3 = gdpData.find(x => x.countryName == d.name).countryCode;
                    return "flags/" + getCountryCode2(code3) + ".svg";
                })
                .attr("height", 18)
                .attr("width",24);
            d3.select("#numsats")
                .text(d.numberSatellites);
            d3.select("#propsats")
                .text((d.proportionSatellites*100).toFixed(2));
            d3.select("#gdp")
                .text((d.gdp/1000000000).toFixed(2));
            d3.select("#bartooltip").classed("hidden", false);
            d3.select(this).attr("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select("#bartooltip").classed("hidden", true);
            d3.select(this).attr("opacity", 0.7);
        });

    svgBars.append('g')
        .append('line')
        .attr("transform", "translate(90, 0)")
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', height + 50)
        .attr('stroke-width', "1px")
        .attr("stroke", "#85858d")
        .attr("marker-end", "url(#arrow)");

    svgBars.append('g')
        .append('text')
        .attr("x", 75)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "hanging")
        .attr("fill", "#85858d")
        .attr("font-family", "Rajdhani")
        .attr("font-size", "16px")
        .text("GDP");
    
    drawSatellites(topTenData, x);
}

function drawSatellites(data, x_scale) {
    // for each country
    var margin = {top: 0, right: 20, bottom: 20, left: 100},
        width = 1000,
        height = 2000;

    var svgSat = d3.select("#satellites");
    var g = svgSat.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "satg");
    var x_start, x_end, x_coord, y_coord;
    var y_scale = d3.scaleLinear()
            .rangeRound([1800,0]);
    y_scale.domain([d3.max(data, function(d) { 
        return d3.max(d.satellites, function(s) {
            return s.altitude;
        });
    }),0]);

    // y scales for each altitude section
    var increments = [0, 50, 50, 50, 50, 50, 50, 50, 50, 100, 150, 250, 250, 250, 250, 250];
    var breakdowns = [0, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 10000, 20000, 30000, 40000, 50000, 175000];
    var var_name_str, var_val_str, rangeMax, rangeMin;
    var this_y_scale;
    for (var i = 0; i < 15; i++) {
        var_name_str = "y_scale_" + breakdowns[i].toString() + "to" + breakdowns[i+1].toString();
        rangeMax = height - increments.slice(0, i+1).reduce(arrSum);
        rangeMin = height - increments.slice(0, i+2).reduce(arrSum);
        var_val_str = "d3.scaleLinear().range(["+ rangeMax +","+ rangeMin +"]).domain([" + breakdowns[i] + "," + breakdowns[i+1] + "])";
        eval(var_name_str + " = " + var_val_str);
        this_y_scale = eval(var_name_str);
        var offset = 30;
        if (breakdowns[i+1] >= 100000) {
            offset = 60;
        } else if (breakdowns[i+1] >= 10000) {
            offset = 50;
        } else if (breakdowns[i+1] >= 1000) {
            offset = 40;
        }
        g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", this_y_scale(breakdowns[i+1]))
            .attr("y2", this_y_scale(breakdowns[i+1]))
            .attr("stroke", "#85858d")
            .attr("stroke-width", "1px");
        g.append("text")
            .attr("x", -15)
            .attr("y", this_y_scale(breakdowns[i+1]))
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#85858d")
            .attr("font-family", "Rajdhani")
            .attr("font-size", "16px")
            .text(breakdowns[i+1].toString());
    }

    // draws each satellite
    data.forEach(element => {
        x_start = x_scale(element.accumulateSatellites);
        x_end = x_scale(element.accumulateSatellites + element.proportionSatellites);
        var svgDim = svgSat.node().getBoundingClientRect();

        element.satellites.forEach(satellite => {
            x_coord = Math.random() * (x_end-x_start) + x_start;
            var_name_str = "y_scale_" + breakdowns[satellite.altitudeCategory].toString() + "to" + breakdowns[satellite.altitudeCategory+1].toString();
            var this_y_scale = eval(var_name_str);
            y_coord = this_y_scale(satellite.altitude);
            randYOffset = (Math.random()*60)-30;
            if(satellite.altitude>34000 && satellite.altitude<36000){
                y_coord+=randYOffset;
            }
            if((satellite.user == "Commercial") && (document.getElementById("commercialCheck").checked == true)){
                g.append("circle")
                    .attr("class", "node")
                    .attr("cx", x_coord)
                    .attr("cy", y_coord)
                    .attr("r", (Math.sqrt(satellite.massDiam*satellite.massDiam/Math.PI)))
                    .attr("fill", element.color)
                    .attr("stroke", element.color)
                    .attr("opacity", 0.7)
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(d3.select(this).attr("cx"))+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(d3.select(this).attr("cy")) + 50)*(svgDim.height/2000);
                        d3.select("#sattooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");
                        d3.select("#countrySat")
                            .text(satellite.countryOperator);
                        d3.select("#name")
                            .text(satellite.name);
                        d3.select("#use")
                            .text(satellite.user);
                        d3.select("#altitude")
                            .text(satellite.altitude);
                        d3.select("#mass")
                            .text(satellite.launchMass);
                        d3.select("#launchDate")
                            .text(satellite.launchDate);
                        d3.select("#contractor")
                            .text(satellite.countryContractor);
                        d3.select(this).attr("opacity", 1);
                        d3.select(this).style("stroke", "white");
                        d3.select("#flag-sat")
                            .attr("src",  function() { 
                                var code3 = gdpData.find(x => x.countryName == satellite.countryOperator).countryCode;
                                return "flags/" + getCountryCode2(code3) + ".svg";
                            })
                            .attr("height", 15)
                            .attr("width",20);
                        d3.select("#sattooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                        highlight(null);
                    });
            } else if(satellite.user == "Civil" && document.getElementById("civilCheck").checked == true){
                var side = Math.sqrt((2*satellite.massDiam*satellite.massDiam)/Math.sqrt(3));
                var x1 = x_coord-(side/2);
                var h = Math.sqrt((side*side)-((side/2)*(side/2)));
                var y1 = y_coord+(h/2);
                var x2 = x_coord;
                var y2 = y_coord-(h/2);
                var x3 = x_coord+(side/2);
                var y3 = y_coord+(h/2);
                var lineData = [{"x":x1, "y":y1}, {"x":x2, "y":y2}, {"x":x3, "y":y3}, {"x":x1, "y":y1}];
                var lineFunction = d3.line()
                    .x(function(d) { return d.x; })
                    .y(function(s) { return s.y; });
                g.append("path")
                    .attr("class", "node")
                    .attr("d", lineFunction(lineData))
                    .attr("fill", element.color)
                    .attr("opacity", 0.7)
                .on("mouseover", function() {
                        var xPosition = (parseFloat(x3)+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(y3)+50)*(svgDim.height/2000);
                        d3.select("#sattooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");
                        d3.select("#countrySat")
                            .text(satellite.countryOperator);
                        d3.select("#name")
                            .text(satellite.name);
                        d3.select("#use")
                            .text(satellite.user);
                        d3.select("#altitude")
                            .text(satellite.altitude);
                        d3.select("#mass")
                            .text(satellite.launchMass);
                        d3.select("#launchDate")
                            .text(satellite.launchDate);
                        d3.select("#contractor")
                            .text(satellite.countryContractor);
                        d3.select(this).attr("opacity", 1);
                        d3.select(this).style("stroke", "white");
                        d3.select("#flag-sat")
                            .attr("src",  function() { 
                                var code3 = gdpData.find(x => x.countryName == satellite.countryOperator).countryCode;
                                return "flags/" + getCountryCode2(code3) + ".svg";
                            })
                            .attr("height", 15)
                            .attr("width",20);
                        d3.select("#sattooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                    });
            }
            else if (satellite.user == "Military" && document.getElementById("militaryCheck").checked == true){
                g.append("rect")
                    .attr("class", "node")
                    .attr("x", (x_coord-(satellite.massDiam/2)))
                    .attr("y", (y_coord-(satellite.massDiam/2)))
                    .attr("width", satellite.massDiam)
                    .attr("height", satellite.massDiam)
                    .attr("fill", element.color)
                    .attr("stroke", element.color)
                    .attr("opacity", 0.7)
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(d3.select(this).attr("x"))+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(d3.select(this).attr("y")) + 50)*(svgDim.height/2000);
                        d3.select("#sattooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");
                        d3.select("#countrySat")
                            .text(satellite.countryOperator);
                        d3.select("#name")
                            .text(satellite.name);
                        d3.select("#use")
                            .text(satellite.user);
                        d3.select("#altitude")
                            .text(satellite.altitude);
                        d3.select("#mass")
                            .text(satellite.launchMass);
                        d3.select("#launchDate")
                            .text(satellite.launchDate);
                        d3.select("#contractor")
                            .text(satellite.countryContractor);
                        d3.select(this).attr("opacity", 1);
                        d3.select(this).style("stroke", "white");
                        d3.select("#flag-sat")
                            .attr("src",  function() { 
                                var code3 = gdpData.find(x => x.countryName == satellite.countryOperator).countryCode;
                                return "flags/" + getCountryCode2(code3) + ".svg";
                            })
                            .attr("height", 15)
                            .attr("width",20);
                        d3.select("#sattooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                    });
            }
            else if (satellite.user == "Government" && document.getElementById("governmentCheck").checked == true){
                var side = satellite.massDiam;
                g.append("rect")
                    .attr("class", "node")
                    .attr("x", (x_coord-(satellite.massDiam/2)))
                    .attr("y", (y_coord-(satellite.massDiam/2)))
                    .attr("width", side)
                    .attr("height", side)
                    .attr("fill", element.color)
                    .attr("stroke", element.color)
                    .attr('transform', 'rotate(-45 ' + x_coord + ' ' + y_coord +')')
                    .attr("opacity", 0.7)
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(d3.select(this).attr("x"))+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(d3.select(this).attr("y")) + 50)*(svgDim.height/2000);
                        d3.select("#sattooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");
                        d3.select("#countrySat")
                            .text(satellite.countryOperator);
                        d3.select("#name")
                            .text(satellite.name);
                        d3.select("#use")
                            .text(satellite.user);
                        d3.select("#altitude")
                            .text(satellite.altitude);
                        d3.select("#mass")
                            .text(satellite.launchMass);
                        d3.select("#launchDate")
                            .text(satellite.launchDate);
                        d3.select("#contractor")
                            .text(satellite.countryContractor);
                        d3.select(this).attr("opacity", 1);
                        d3.select(this).style("stroke", "white");
                        d3.select("#flag-sat")
                            .attr("src",  function() { 
                                var code3 = gdpData.find(x => x.countryName == satellite.countryOperator).countryCode;
                                return "flags/" + getCountryCode2(code3) + ".svg";
                            })
                            .attr("height", 15)
                            .attr("width",20);
                        d3.select("#sattooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                    });
            }
            else if((satellite.user.includes("/")) && (document.getElementById("multipleCheck").checked == true)){
                var side = Math.sqrt((2*satellite.massDiam*satellite.massDiam)/(3*Math.sqrt(3)));
                var hHex = Math.sqrt((side*side)-((side/2)*(side/2)));
                var y1 = y_coord + hHex;
                var x1 = x_coord - (hHex/2);
                var y2 = y_coord;
                var x2 = x_coord - side;
                var y3 = y_coord - hHex;
                var x3 = x_coord - (hHex/2);
                var y4 = y_coord - hHex;
                var x4 = x_coord + (hHex/2);
                var y5 = y_coord;
                var x5 = x_coord +side;
                var y6 = y_coord + hHex;
                var x6 = x_coord + (hHex/2);
                var hexLineData = [{"x":x1, "y":y1}, {"x":x2, "y":y2}, {"x":x3, "y":y3}, {"x":x4, "y":y4}, {"x":x5, "y":y5}, {"x":x6, "y":y6}, {"x":x1, "y":y1}];
                var hexFunction = d3.line()
                    .x(function(d) { return d.x; })
                    .y(function(s) { return s.y; });
                g.append("path")
                    .attr("class", "node")
                    .attr("d", hexFunction(hexLineData))
                    .attr("fill", element.color)
                    .attr("opacity", 0.7)
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(x5)+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(y5) + 50)*(svgDim.height/2000);
                        d3.select("#sattooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px");
                        d3.select("#countrySat")
                            .text(satellite.countryOperator);
                        d3.select("#name")
                            .text(satellite.name);
                        d3.select("#use")
                            .text(satellite.user);
                        d3.select("#altitude")
                            .text(satellite.altitude);
                        d3.select("#mass")
                            .text(satellite.launchMass);
                        d3.select("#launchDate")
                            .text(satellite.launchDate);
                        d3.select("#contractor")
                            .text(satellite.countryContractor);
                        d3.select("#flag-sat")
                            .attr("src",  function() { 
                                var code3 = gdpData.find(x => x.countryName == satellite.countryOperator).countryCode;
                                return "flags/" + getCountryCode2(code3) + ".svg";
                            })
                            .attr("height", 15)
                            .attr("width",20);
                        d3.select(this).attr("opacity", 1);
                        d3.select(this).style("stroke", "white");
                        d3.select("#sattooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                    });
            }
        });
    });
}

// Load data from csv
// Call callbacks to generate images
d3.csv("gdpGood.csv", parseGdpRow, gdpCallback);
d3.csv("satellites.csv", parseSatelliteRow, satelliteCallback);



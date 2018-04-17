var gdpData;
var satelliteData;
var topTenData = [];
var byCountry;

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
    var valid = false;
    if (yearSlider.value >= 2000) {
        if ((year > 0 && year <= yearSlider.value.toString().substring(2,4)) || year >= 74)  {
            valid = true;    
        }
    } else if (year >=74 && year <= yearSlider.value.toString().substring(2,4)) {
        valid = true;
    }
    if (valid) {
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

        return {
            name: row["Current Official Name of Satellite"],
            series: row["Series"],
            countryOperator: country, //gdp
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

//parse country codes for flags in tooltips
var codes;
d3.json("countrycodes.json", function (data) {
    codes = data;
    console.log(codes);
    console.log(getCountryCode2("USA"));
})

function getCountryCode2(countryCode3) {
     return codes[0].countryCode3.toLowerCase();
}

function highlight(series) {
    if (series == null) d3.selectAll(".node").classed("active", false);
    else d3.selectAll(".node." + series).classed("active", true);
}

function satelliteCallback(err, data) {
    satelliteData = data;
    // console.log(gdpData);
    // console.log(satelliteData);

    byCountry = d3.nest()
        .key(function(d){ return d.countryOperator;})
        .entries(data);
    byCountry = byCountry.sort(customCompare);

    drawBars(byCountry);
    
    // implement a sticky header, adapted from: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sticky_header

    window.onscroll = function() {stickFunc()};
    var header = document.getElementById("legendbar");
    var sticky = header.offsetTop;
    function stickFunc(){

        if (window.pageYOffset >= 204){  
            header.classList.add("sticky");
        }
        else{
            header.classList.remove("sticky");
        }
    };

    commCheck = document.getElementById("commercialCheck");
    commCheck.onchange = function(){
        changeFunc();
    };
    civilCheck = document.getElementById("civilCheck");
    civilCheck.onchange = function(){
        changeFunc();
    };
    militaryCheck = document.getElementById("militaryCheck");
    militaryCheck.onchange = function(){
        changeFunc();
    };
    governmentCheck = document.getElementById("governmentCheck");
    governmentCheck.onchange = function(){
        changeFunc();
    };
    multipleCheck = document.getElementById("multipleCheck");
    multipleCheck.onchange = function(){
        changeFunc();

    };
    function changeFunc(){
        d3.select("#satellites").selectAll("circle").remove();
        d3.select("#satellites").selectAll("path").remove();
        d3.select("#satellites").selectAll("rect").remove();
        drawBars(byCountry);
    };
}

function drawBars(byCountry) {
    // extracting the ten countries with the most satellites
    var idx = 0;
    var count = 0;
    var topTen = [];
    while (count < 10) {
        if (byCountry[idx].key !== "Multinational" && byCountry[idx].key !== "ESA") {
            topTen.push(byCountry[idx]);
            count++;
        }
        idx++;
    }

    // group the remainder into a single category
    var remainder = byCountry.splice(12);

    function findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    };

    var mult_idx = findWithAttr(byCountry, "key", "Multinational");
    remainder.push(byCountry[mult_idx]);
    var esa_idx = findWithAttr(byCountry, "key", "ESA");
    remainder.push(byCountry[esa_idx]);
    console.log(remainder);

    var flatRemainder = [];
    function flatten(array) {
        for (var i=0; i < array.length; i++) {
            var current = array[i].values;
            for (var j=0; j < current.length; j++) {
                flatRemainder.push(current[j])
            }
        }
        return flatRemainder;
    }
    flatten(remainder);
    topTen.push({key: "Other", values: flatRemainder});

    // calculate total satellites
    var totalSatellites = 0;
    for (var i=0; i < 11; i++) {
        totalSatellites += topTen[i].values.length;
    };
    console.log(totalSatellites);
    topTenData = [];
    // organizing top ten country data for the gdp bar chart
    var thisCountryData;
    var acc = 0;
    var colors = ["#7f2962", "#ac1e4e", "#ef4351", "#f79a62", "#fcd017", "#c0cf2f", "#5eb182", "#50b4ba", "#007ec3", "#3a4ea1", "#c1c1c1"];
    for (var i=0; i < 11; i++) {
        if (topTen[i].key !== "Other") {
            thisCountryData = {
                name: topTen[i].key,
                numberSatellites: topTen[i].values.length,
                proportionSatellites: (topTen[i].values.length/totalSatellites),
                accumulateSatellites: acc,
                gdp: (gdpData.find(x => x.countryName == topTen[i].key).GDP[document.getElementById("yearslider").value]),
                satellites: topTen[i].values, 
                color: colors[i]
            };
            console.log(gdpData.find(x => x.countryName == topTen[i].key));
        } else {
            thisCountryData = {
                name: topTen[i].key,
                numberSatellites: topTen[i].values.length,
                proportionSatellites: (topTen[i].values.length/totalSatellites),
                accumulateSatellites: acc,
                gdp: 0,
                satellites: topTen[i].values, 
                color: colors[i]
            };
        }
        topTenData.push(thisCountryData);
        acc += topTen[i].values.length/totalSatellites;
    }

    d3.select("#gdpbars").selectAll("rect").remove();
    d3.select("#gdpbars").selectAll("g").remove();
    
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
        .attr("height", function(d) { return height - y(d.gdp); })
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
            d3.select("#numsats")
                .text(d.numberSatellites);
            d3.select("#propsats")
                .text(d.proportionSatellites*100);
            d3.select("#gdp")
                .text((d.gdp/1000000000).toFixed(2));
            d3.select("#bartooltip").classed("hidden", false);
            d3.select(this).attr("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select("#bartooltip").classed("hidden", true);
            d3.select(this).attr("opacity", 0.7);
        });
<<<<<<< HEAD

    // create footer
    var footer = d3.select("#svgFooter");
    var padding = 0,
        margin = {top: 0, right: 20, bottom: 0, left: 100},
        width = 1000,
        height = 50;
    var footerBars = footer.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    footerBars.selectAll(".bar")
        .data(topTenData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.accumulateSatellites); })
        .attr("y", function(d) { return 0; })
        .attr("width", function(d) { return x(d.proportionSatellites);})
        .attr("height", 50)
        .attr("fill", function(d) { return d.color; })
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(this).attr("opacity", 1);
            d3.selectAll("node").filter(function(d) {
                return d.key == data.key;
            })
            .style("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
        });
    // footerBars.selectAll(".bar")
    //     .enter().append("text")

    
    // implement a sticky header, adapted from: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sticky_header

    window.onscroll = function() {stickHeadFunc()};
    var header = document.getElementById("legendbar");
    // var divFooter = document.getElementById("divFooter");
    function stickHeadFunc(){
        if (window.pageYOffset >= 204){  
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }
    };

    // window.onscroll = function() {stickFootFunc()};
    // var divFooter = document.getElementById("divFooter");
    // function stickFootFunc(){
    //     if (window.pageYOffset <= 2000) {
    //         divFooter.classList.add("stickyBelow");
    //     } else {
    //         divFooter.classList.remove("stickyBelow");
    //     }
    // };
    // implement a sticky footer, adapted from: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sticky_header
    // var winHeight = window.innerHeight;
    // var bodyHeight = document.body.offsetHeight;
    // window.onscroll = function() {stickFootFunc()};
    // var divFooter = document.getElementById("divFooter");
    // var stickyBelow = footer.offset;
    //     function stickFootFunc(){
    //         if (window.pageYOffset >= 204){  
    //             divFooter.classList.add("stickyBelow");
    //         }
    //         else{
    //             divFooter.classList.remove("stickyBelow");
    //         }
    //     };

=======
>>>>>>> ab5f310dcf2fa019d55ee13aa4c6c4ea04e63046
    drawSatellites(topTenData, x);
}


function drawSatellites(data, x_scale) {
    // console.log(data);
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
    var increments = [0, 50, 50, 50, 50, 50, 50, 50, 50, 100, 150, 200, 200, 200, 200, 250];
    var breakdowns = [0, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 10000, 20000, 30000, 40000, 50000, 175000];
    var var_name_str, var_val_str, rangeMax, rangeMin;
    var this_y_scale;
    for (var i = 0; i < 15; i++) {
        var_name_str = "y_scale_" + breakdowns[i].toString() + "to" + breakdowns[i+1].toString();
        rangeMax = height - increments.slice(0, i+1).reduce(arrSum);
        rangeMin = height - increments.slice(0, i+2).reduce(arrSum);
        var_val_str = "d3.scaleLinear().range(["+ rangeMax +","+ rangeMin +"]).domain([" + breakdowns[i] + "," + breakdowns[i+1] + "])";
        eval(var_name_str + " = " + var_val_str);
        // var ans = eval(var_name_str + "(300)");
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
        
        // insert annotations for orbit levels: LEO at 2000km
        // if (breakdowns[i+1] = 2000) {
        //     g.append("line")
        //     .attr("x1", 0)
        //     .attr("x2", width)
        //     .attr("y1", this_y_scale(2000))
        //     .attr("y2", this_y_scale(2000))
        //     .attr("stroke", "#ffffff")
        //     .attr("stroke-width", "10px");
        // }
    }


    data.forEach(element => {
        x_start = x_scale(element.accumulateSatellites);
        x_end = x_scale(element.accumulateSatellites + element.proportionSatellites);
        var svgDim = svgSat.node().getBoundingClientRect();
        // console.log(svgDim.width);

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
                    .attr("r", (satellite.massDiam/2))
                    .attr("fill", element.color)
                    .attr("stroke", element.color)
                    .attr("opacity", 0.7)
                    // .attr("class", function(d) { return "node " + d.series})
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(d3.select(this).attr("cx"))+20)*(svgDim.width/1200);
                        // console.log(parseFloat(d3.select(this).attr("cx")));
                         // + parseFloat(d3.select(this).attr("r")) + 15;
                        var yPosition = (parseFloat(d3.select(this).attr("cy")) + 50)*(svgDim.height/2000);
                        // console.log(yPosition);
                        // if(xPosition > (document.getElementById("content").offsetWidth)/2){
                        //     xPosition = xPosition - (230+parseFloat(d3.select(this).attr("r")));
                        // }
                        // console.log("xPos=" + xPosition);
                        // console.log(parseFloat(d3.select(this).attr("cx")));
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
                        d3.select("#sattooltip").classed("hidden", false);
                        // highlight(d.series);
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", .7);
                        d3.select(this).style("stroke", "none");
                        d3.select("#sattooltip").classed("hidden", true);
                        highlight(null);
                    });
            }else if(satellite.user == "Civil" && document.getElementById("civilCheck").checked == true){
                var x1 = x_coord-(satellite.massDiam/2);
                var h = Math.sqrt((satellite.massDiam*satellite.massDiam)-((satellite.massDiam/2)*(satellite.massDiam/2)));
                var y1 = y_coord+(h/2);
                var x2 = x_coord;
                var y2 = y_coord-(h/2);
                var x3 = x_coord+(satellite.massDiam/2);
                var y3 = y_coord+(h/2);
                var lineData = [{"x":x1, "y":y1}, {"x":x2, "y":y2}, {"x":x3, "y":y3}];
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
                        var yPosition = (parseFloat(y3) + 50)*(svgDim.height/2000);
                          // + document.getElementById("intro").offsetHeight + 350;

                        // if(xPosition> (document.getElementById("content").offsetWidth)/2){

                        //     xPosition = xPosition - 230;
                        // }
                        // console.log("xPos=" + xPosition);
                        // console.log(parseFloat(d3.select(this).attr("cx")));
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
                         // + document.getElementById("intro").offsetHeight + 350;
                        // if(xPosition> (document.getElementById("content").offsetWidth)/2){
                        //     xPosition = xPosition - 230;
                        // }
                        // console.log("xPos=" + xPosition);
                        // console.log(parseFloat(d3.select(this).attr("cx")));
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
                        d3.select("#sattooltip").classed("hidden", false);
                        })
                        .on("mouseout", function() {
                            d3.select(this).attr("opacity", .7);
                            d3.select(this).style("stroke", "none");
                            d3.select("#sattooltip").classed("hidden", true);
                        });
            }
            else if (satellite.user == "Government" && document.getElementById("governmentCheck").checked == true){
                g.append("rect")
                    .attr("class", "node")
                    .attr("x", (x_coord-(satellite.massDiam/2)))
                    .attr("y", (y_coord-(satellite.massDiam/2)))
                    .attr("width", satellite.massDiam)
                    .attr("height", satellite.massDiam)
                    .attr("fill", element.color)
                    .attr("stroke", element.color)
                    .attr('transform', 'rotate(-45 ' + x_coord + ' ' + y_coord +')')
                    .attr("opacity", 0.7)
                    .on("mouseover", function() {
                        var xPosition = (parseFloat(d3.select(this).attr("x"))+20)*(svgDim.width/1200);
                        var yPosition = (parseFloat(d3.select(this).attr("y")) + 50)*(svgDim.height/2000);
                         // + document.getElementById("intro").offsetHeight + 350;
                        // if(xPosition> (document.getElementById("content").offsetWidth)/2){
                        //     xPosition = xPosition - 230;
                        // }
                        // console.log("xPos=" + xPosition);
                        // console.log(parseFloat(d3.select(this).attr("cx")));
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
                        d3.select("#sattooltip").classed("hidden", false);
                        })
                        .on("mouseout", function() {
                            d3.select(this).attr("opacity", .7);
                            d3.select(this).style("stroke", "none");
                            d3.select("#sattooltip").classed("hidden", true);
                        });
            }
            else if((satellite.user.includes("/")) && (document.getElementById("multipleCheck").checked == true)){
                var hHex = Math.sqrt((satellite.massDiam*satellite.massDiam)-((satellite.massDiam/2)*(satellite.massDiam/2)));
                var y1 = y_coord + hHex;
                var x1 = x_coord - (hHex/2);
                var y2 = y_coord;
                var x2 = x_coord - satellite.massDiam;
                var y3 = y_coord - hHex;
                var x3 = x_coord - (hHex/2);
                var y4 = y_coord - hHex;
                var x4 = x_coord + (hHex/2);
                var y5 = y_coord;
                var x5 = x_coord +satellite.massDiam;
                var y6 = y_coord + hHex;
                var x6 = x_coord + (hHex/2);
                var hexLineData = [{"x":x1, "y":y1}, {"x":x2, "y":y2}, {"x":x3, "y":y3}, {"x":x4, "y":y4}, {"x":x5, "y":y5}, {"x":x6, "y":y6}];
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
                          // + document.getElementById("intro").offsetHeight + 350;
                        // if(xPosition> (document.getElementById("content").offsetWidth)/2){
                        //     xPosition = xPosition - 250;
                        // }
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
                        d3.select("#flag")
                            // .attr("src",  function(d) { return d.img;})
                            .attr("src",  "flags/ad.svg")
                            .attr("x", xPosition + 250)
                            .attr("y", yPosition + 10)
                            .attr("height", 30)
                            .attr("width", 40);
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

// Create a d3 force simulation
                // var simulation = d3.forceSimulation();
                // var node = d3.selectAll("node");
                // simulation.force("x", d3.forceX(d => x_scale(d.x)).strength(0.5)) // default strength is 0.1
                // .force("y", d3.forceY(d => y_scale(d.y)))
                // .force("collision", d3.forceCollide(d => rScale(d.b)));

                // simulation.nodes(node).on("tick", updateDisplay);

                // updateDisplay();

                // function updateDisplay() {
                //     node
                //     .attr("x", function(d) { return d.x; })
                //     .attr("y", function(d) { return d.y; });
                // }

// implement range slider

// Load data from csv
// Call callbacks to generate images

d3.csv("gdpGood.csv", parseGdpRow, gdpCallback);
d3.csv("satellites.csv", parseSatelliteRow, satelliteCallback);

function sliderHandler() {
    var yearSlider = document.getElementById("yearslider");
    var sliderLabel = document.getElementById("sliderlabel");
    sliderLabel.innerHTML =  "&#8672;     SELECT YEAR RANGE (1974-"+ yearSlider.value +")";
    drawBars(byCountry);
}

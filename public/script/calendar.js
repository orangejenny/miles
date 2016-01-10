// Adapted from http://bl.ocks.org/mbostock/4063318
    var cellSize = 17,
        width = cellSize * 53 + 2,  // offset to account for month path width
        height = cellSize * 7 + 5;  // offset to account for month path width plus vertical margin between years

function generateCalendar(json) {
    var minDate = new Date(d3.min(json, function(d) { return d.DAY; })),
        maxDate = new Date(d3.max(json, function(d) { return d.DAY; }));

    var format = d3.time.format("%Y-%m-%d");

    d3.select("#calendar").attr("width", 3000);
    
    var svg = d3.select("#calendar").selectAll("svg")
        .data(d3.range(minDate.getFullYear(), maxDate.getFullYear() + 1))
      .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(1, 1)");  // account for month path width
    
    var rect = svg.selectAll(".day")
        .data(function(d) {
            return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
         })
      .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) { return d3.time.weekOfYear(d) * cellSize; })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .datum(format);
    
    rect.append("title")
        .text(function(d) { return d; });
    
    svg.selectAll(".month")
        .data(function(d) {
            return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
         })
      .enter().append("path")
        .attr("class", "month")
        .attr("d", monthPath);
    
        var data = d3.nest()
                     .key(function(d) { return d.DAY; })
                     .rollup(function(d) { return d[0].WORKOUTS[0] || {}; })
                     .map(json);
    
        rect.filter(function(d) { return d in data; })
            .attr("class", function(d) { return "day " + activityClass(data[d].ACTIVITY); })
            .select("title")
            .text(function(d) { return d + ": " + data[d].ACTIVITY; });
}

function activityClass(activity) {
    if (activity === "running" || activity === "erging" || activity === "crossfit"
        || activity === "sculling" || activity === "swimming") {
        return activity;
    }
    if (activity === "squats" || activity === "cleans" || activity === "deadlifts"
        || activity === "bench press" || activity === "overhead press" || activity === "barbell rows") {
        return "lifting";
    }
    if (activity === "treadmill") {
        return "running";
    }
    return "other";
}

function monthPath(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
        d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
         + "H" + w0 * cellSize + "V" + 7 * cellSize
         + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
         + "H" + (w1 + 1) * cellSize + "V" + 0
         + "H" + (w0 + 1) * cellSize + "Z";
}

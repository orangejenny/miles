// Adapted from http://bl.ocks.org/mbostock/4063318
    var cellSize = 17,
        height = cellSize * 7 + 5;  // offset to account for month path width plus vertical margin between years

var format = d3.time.format("%Y-%m-%d");

function generateCalendar(json) {
    var minDataDate = new Date(d3.min(json, function(d) { return d.DAY; })),
        maxDataDate = new Date(d3.max(json, function(d) { return d.DAY; })),
        // Display the full month around the min and max dates returned by data
        minDate = new Date(minDataDate.getFullYear(), minDataDate.getMonth(), 1),
        maxDate = new Date(maxDataDate.getFullYear(), maxDataDate.getMonth() + 1, 1);

    var svg = d3.select("#calendar").selectAll("svg")
        .data(d3.range(minDate.getFullYear(), maxDate.getFullYear() + 1))
      .enter().append("svg")
        .attr("width", function(d) {
            var weeks = 53;
            if (d === minDate.getFullYear()) {
                weeks = 53 - d3.time.weekOfYear(minDate);
            } else if (d === maxDate.getFullYear()) {
                weeks = d3.time.weekOfYear(maxDate) + 1;
            }
            return weeks * cellSize + 2 + 5;  // offsets to account for month path width and horizontal space between years
        })
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(1, 1)");   // account for month path width

    // Roll up workout data
    var data = d3.nest()
                 .key(function(d) { return d.DAY; })
                 .rollup(function(d) { return d[0]; })
                 .map(json);
    
    // Draw squares for days
    var rect = svg.selectAll(".day")
        .data(function(d) {
            var days = [];
            if (d === minDate.getFullYear()) {
                days = d3.time.days(minDate, new Date(d + 1, 0, 1));
            } else if (d === maxDate.getFullYear()) {
                days = d3.time.days(new Date(d, 0, 1), maxDate);
            } else {
                days = d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            }
            return days;
         })
      .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) {
            if (minDate.getFullYear() === d.getFullYear()) {
                return (d3.time.weekOfYear(d) - d3.time.weekOfYear(minDate)) * cellSize;
            }
            return d3.time.weekOfYear(d) * cellSize;
        })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .datum(function(day) {
            var extra = {};
            if (data[format(day)]) {
                extra = data[format(day)];
            }
            return _.extend({
                DATE: day,
            }, extra);
        });

    // Color in days, based on activity
    rect.attr("class", function(d) { return "day " + activityClass(d); })
        .select("title")
        .text(function(d) { return d + ": " + d.ACTIVITY; });
    
    // Add extra-thick month boundaries
    svg.selectAll(".month")
        .data(function(d) {
            if (d === minDate.getFullYear()) {
                return d3.time.months(minDate, new Date(d + 1, 0, 1));
            } else if (d === maxDate.getFullYear()) {
                return d3.time.months(new Date(d, 0, 1), maxDate);
            }
            return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
         })
      .enter().append("path")
        .attr("class", "month")
        .attr("d", function(d) { return monthPath(d, minDate); });
    
    attachTooltip("#calendar g rect");
}

function activityClass(data) {
    if (!data || !data.WORKOUTS || !data.WORKOUTS.length) {
        return "";
    }
    var activity = data.WORKOUTS[0].ACTIVITY;
    if (_.contains(["running", "erging", "crossfit", "sculling", "swimming"], activity)) {
        return activity;
    }
    if (_.contains(["squats", "cleans", "deadlifts", "bench press", "overhead press", "barbell rows"], activity)) {
        return "lifting";
    }
    if (activity === "treadmill") {
        return "running";
    }
    return "other";
}

function monthPath(t0, min) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        weekOffset = (t0.getFullYear() === min.getFullYear() ? d3.time.weekOfYear(min) : 0),
        d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0) - weekOffset,
        d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1) - weekOffset;
    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
         + "H" + w0 * cellSize + "V" + 7 * cellSize
         + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
         + "H" + (w1 + 1) * cellSize + "V" + 0
         + "H" + (w0 + 1) * cellSize + "Z";
}

function attachTooltip(selector) {
    var positionTooltip = function() {
        var tooltip = document.getElementById("tooltip");
        if (tooltip.classList.contains("hide")) {
            return;
        }
        tooltip.style.left = d3.event.pageX + 10;
        tooltip.style.top = d3.event.pageY;
    };

    d3.selectAll(selector).on("mouseenter.tooltip", function() {
        var data = d3.select(this).data()[0];
        var tooltip = document.getElementById("tooltip");
        var description = format(data.DATE);
        if (data.WORKOUTS) {
            description += "<br>" + _.map(data.WORKOUTS, function(w) { return serializeWorkout(w) }).join("<br>");
        }
        tooltip.innerHTML = description;
        tooltip.classList.remove("hide");
        positionTooltip();
    });
    d3.selectAll(selector).on("mouseleave.tooltip", function() {
        document.getElementById("tooltip").classList.add("hide");
    });
    d3.selectAll(selector).on("mousemove.tooltip", function() {
        positionTooltip();
    });
}

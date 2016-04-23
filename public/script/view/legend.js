define([
    "underscore",
    "text!template/record.html",
    "util/pace",
    "util/workout",
], function(
    _,
    record,
    pace,
    workout,
undefined) {
    var render = function(allDays) {
        var list = document.getElementById("legend"),
            template = _.template(record);
    
        list.innerHTML = '';
        var daysByActivity = _.groupBy(allDays, workout.activityClass),
            sortedActivities = _.sortBy(_.keys(daysByActivity), function(activity) {
                return -1 * daysByActivity[activity].length;
            });
    
        _.each(sortedActivities, function(activity) {
            var records = [],
                workouts = _.flatten(_.map(daysByActivity[activity], function(day) {    // will be sorted by day, descending
                    return _.map(day.WORKOUTS, function(w) {
                        return _.extend(w, {
                            DAY: day.DAY,
                            ID: Number(w.ID),
                            REPS: Number(w.REPS),
                            SETS: Number(w.SETS),
                            WEIGHT: Number(w.WEIGHT),
                            TIME: Number(w.TIME),
                            DISTANCE: Number(w.DISTANCE),
                        });
                    });
                }));
            
            // Fastest
            if (activity === "running" || activity === "erging") {
                var goldenDistances = [],   // lazily, but reasonably, ignoring units
                    groupBy = '';
                if (activity === "erging") {
                    goldenDistances = [6, 2, 500];
                    groupBy = 'DISTANCE';
                } else {
                    goldenDistances = ["long", "medium", "short"];
                    groupBy = function(w) {
                        if (w.DISTANCE < "5") {
                            return "short";
                        }
                        if (w.DISTANCE > 10) {
                            return "long";
                        }
                        return "medium";
                    };
                }
                var workoutsByDistance = _.groupBy(_.filter(workouts, function(w) {
                    return w.DISTANCE && w.TIME && (!w.REPS || w.REPS === 1);
                }), groupBy);
                _.each(goldenDistances, function(distance) {
                    if (workoutsByDistance[distance]) {
                        var min;
                        _.each(workoutsByDistance[distance], function(w) {
                            if (!min || min.TIME / min.DISTANCE > w.TIME / w.DISTANCE) {
                                min = w;
                            }
                        });
                        records.push({
                            DESCRIPTION: workout.serializeWorkout(min, true),
                            DAY: min.DAY,
                        });
                    }
                });
            }
    
            // Total distance covered
            if (activity === "erging" || activity === "running") {
                var total = 0,
                    goldenUnit = activity === "erging" ? "km" : "mi";
                _.each(workouts, function(w) {
                    var distance = w.DISTANCE;
                    if (distance) {
                        if (w.UNIT !== goldenUnit) {
                            distance = pace.convertDistance(w.DISTANCE, w.UNIT, goldenUnit);
                        }
                        total += distance;
                    }
                });
                records.push({
                    DESCRIPTION: parseInt(total) + " " + goldenUnit + " total",
                });
            }
    
            // Max weight, per lift
            if (activity === "lifting") {
                _.each(_.groupBy(workouts, 'ACTIVITY'), function(workouts, lift) {
                    var max = workouts[0];
                    _.each(workouts, function(w) {
                        if (w.WEIGHT > max.WEIGHT) {
                            max = w;
                        }
                    });
                    records.push({
                        DESCRIPTION: lift + "@" + max.WEIGHT,
                        DAY: max.DAY,
                    });
                });
            }
    
            // Total count
            records.push({
                DESCRIPTION: daysByActivity[activity].length + " days",
            });
    
            list.innerHTML += template({
                ACTIVITY: activity,
                CLASS: workout.activityClass(activity),
                RECORDS: records,
            });
        });
    
        // Add hover events to toggle record lists
        _.each(document.querySelectorAll("#legend > li"), function(li) {
            li.addEventListener("mouseover", function(e) {
                e.currentTarget.querySelector(".records").style.display = "block";
            });
            li.addEventListener("mouseout", function(e) {
                e.currentTarget.querySelector(".records").style.display = "none";
            });
        });
    };

    return {
        render: render,
    };
});

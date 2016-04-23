/*
    Utility functions related to workouts.
*/
define([
    "underscore",
], function(
    _,
undefined) {
    var activityClass = function(data) {
        var activity;
        if (_.isString(data)) {
            activity = data;
        } else if (data && data.WORKOUTS && data.WORKOUTS.length) {
            activity = data.WORKOUTS[0].ACTIVITY;
        } else {
            return;
        }
    
        var activity = _.isString(data) ? data : data.WORKOUTS[0].ACTIVITY;
        if (_.contains(["running", "erging", "crossfit", "sculling", "swimming", "lifting"], activity)) {
            return activity;
        }
        if (_.contains(["squats", "cleans", "deadlifts", "bench press", "overhead press", "barbell rows"], activity)) {
            return "lifting";
        }
        if (activity === "treadmill") {
            return "running";
        }
        return "other";
    };

    var serializeWorkout = function(workout, excludeActivity) {
        var pace = require('util/pace'),
            text = excludeActivity ? '' : workout.ACTIVITY;
        if (workout.SETS) {
            text += " " + workout.SETS + " x";
        }
        if (workout.REPS) {
            text += " " + workout.REPS;
            if (workout.DISTANCE || workout.TIME) {
                text += " x";
            }
        }
        if (workout.DISTANCE) {
            text += " " + workout.DISTANCE + " " + workout.UNIT;
            if (workout.TIME) {
                text += " in"
            }
        }
        if (workout.TIME) {
            text += " " + pace.timeToString(workout.TIME);
            var pace = pace.getPace(workout);
            if (pace) {
                text += " (" + pace + ")";
            }
        }
        if (workout.WEIGHT) {
            text += " @ " + workout.WEIGHT + "lb";
        }
        text = text.trim();
        return text;
    };

    return {
        activityClass: activityClass,
        serializeWorkout: serializeWorkout,
    };
});

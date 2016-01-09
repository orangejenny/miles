#!/usr/bin/perl

use lib "..";
use strict;

use CGI;
use Miles;
use Data::Dumper;

my $dbh = Miles::DBH();
my $fdat = Miles::Fdat();

my $cgi = CGI->new;
print $cgi->header();

if ($fdat->{NEW} == 1) {
    my $day = sprintf("%s-%s-%s", $fdat->{YEAR}, $fdat->{MONTH}, $fdat->{DAY});
    my @workouts = ();
    while ($fdat->{"ACTIVITY" . scalar(@workouts)}) {
        my $workout = {};
        foreach my $param (qw(ACTIVITY SETS REPS WEIGHT DISTANCE UNIT TIME)) {
            $workout->{$param} = $fdat->{$param . scalar(@workouts)};
        }
        if ($workout->{TIME}) {
            my $time = 0;
            my $factor = 1;
            foreach my $piece (reverse(split(/:/, $workout->{TIME}))) {
                $time += $piece * $factor;
                $factor *= 60;
            }
            $workout->{TIME} = $time;
        }
        push(@workouts, $workout);
    }
    Miles::AddDay($dbh, {
        DAY => $day,
        NOTES => $fdat->{NOTES},
        WORKOUTS => \@workouts,
    });

    # Prevent resubmission on refresh
    print $cgi->redirect("index.pl");
}

print qq{
    <html>
    	<head>
    		<link rel="stylesheet" type="text/css" href="style/miles.css"></link>
    		<link rel="stylesheet" type="text/css" href="style/calendar.css"></link>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
    		<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
    		<script src="script/calendar.js"></script>
    		<script src="script/miles.js"></script>
            <title>Miles</title>
    	</head>
    	<body>
            <div id="calendar"></div>
            <form id="new-day" method="POST">
                <fieldset>
                    <legend>it's a new day</legend>
                    <span>Day of the week</span>
                    <input type="text" name="month" placeholder="month" />
                    <input type="text" name="day" placeholder="day" />
                    <input type="text" name="year" placeholder="year" />
                    <input type="hidden" name="new" value="1" />
                    <textarea name="notes" placeholder="How was today?"></textarea>
                    <div class="workouts"></div>
                    <button type="button" id="add-workout">Add workout</button>
                    <button type="submit">Save</button>
                </fieldset>
            </form>
            <ul id="list"></ul>
    
            <script type="text/template" name="day">
                <li>
                    <%= DAY %><% if (NOTES) { %>: <%= NOTES %><% } %>
                    <% if (WORKOUTS) { %>
                        <ul>
                            <% _.each(WORKOUTS, function(w) { %>
                                <li><%= w.DESCRIPTION %></li>
                            <% }) %>
                        </ul>
                    <% } %>
                </li>
            </script>
    
            <script type="text/template" name="blank-workout">
                <select name="activity<%= index %>">
                    <option>running</option>
                    <option>erging</option>
                    <option>crossfit</option>
                    <option>squats</option>
                    <option>bench press</option>
                    <option>overhead press</option>
                    <option>deadlifts</option>
                    <option>cleans</option>
                </select>
                <input type="text" name="sets<%= index %>" placeholder="sets" />
                <input type="text" name="reps<%= index %>" placeholder="reps" />
                <input type="text" name="weight<%= index %>" placeholder="weight" />
                <input type="text" name="distance<%= index %>" placeholder="distance" />
                <input type="text" name="unit<%= index %>" placeholder="unit" />
                <input type="text" name="time<%= index %>" placeholder="time" />
            </script>
    	</body>
    </html>
};

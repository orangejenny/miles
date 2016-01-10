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

my @time = localtime;
my ($sec, $min, $hour, $day, $month, $year, $wday, $yday, $isdst) = localtime;
$day = $fdat->{DAY} || $day;
$month = $fdat->{MONTH} || $month + 1;
$year = $fdat->{YEAR} || $year + 1900;

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
                    <legend>
                        <span>Friday</span>
                        <input type="text" name="month" placeholder="month" maxlength="4" value="$month" />
                        <input type="text" name="day" placeholder="day" maxlength="4" value="$day" />
                        <input type="text" name="year" placeholder="year" maxlength="4" value="$year" />
                    </legend>
                    <input type="hidden" name="new" value="1" />
                    <button type="button" id="add-workout" class="pull-right">Add another workout</button>
                    <div class="workouts"></div>
                    <div class="row">
                        <textarea name="notes" placeholder="How was today?"></textarea>
                    </div>
                    <button type="submit" class="primary">Save</button>
                </fieldset>
            </form>
            <ul id="day-list"></ul>
    
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
                <div class="row">
                    <div class="pull-left">
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
                    </div>
                    <div class="pull-left">
                        <div class="row">
                            <input type="text" name="sets<%= index %>" placeholder="sets" />
                            <input type="text" name="reps<%= index %>" placeholder="reps" />
                            <input type="text" name="weight<%= index %>" placeholder="weight" />
                        </div>
                        <div class="row">
                            <input type="text" name="distance<%= index %>" placeholder="distance" />
                            <input type="text" name="unit<%= index %>" placeholder="unit" />
                            <input type="text" name="time<%= index %>" placeholder="time" />
                        </div>
                    </div>
                </div>
            </script>
    	</body>
    </html>
};

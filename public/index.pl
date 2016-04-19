#!/usr/bin/perl

use lib "..";
use strict;

use CGI;
use JSON qw(to_json);
use Miles;

my $dbh = Miles::DBH();
my $fdat = Miles::Fdat();

my $cgi = CGI->new;
print $cgi->header();

my $error = "";

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
    $error = Miles::AddDay($dbh, {
        DAY => $day,
        NOTES => $fdat->{NOTES},
        WORKOUTS => \@workouts,
    });
}

if ($error) {
    $error = "<div id='error'>$error</div>";
}

# Current date
my @time = localtime;
my ($sec, $min, $hour, $day, $month, $year, $wday, $yday, $isdst) = localtime;
$day = $fdat->{DAY} || $day;
$month = $fdat->{MONTH} || $month + 1;
$year = $fdat->{YEAR} || $year + 1900;

my $years = $fdat->{YEARS} || 1;

print qq{
    <html>
    	<head>
    		<link rel="stylesheet" type="text/css" href="style/index.css"></link>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
    		<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
    		<script src="script/calendar.js"></script>
    		<script src="script/miles.js"></script>
            <title>Miles</title>
    	</head>
    	<body>
            $error
            <div id="filter-years">
                <input type="text" value="$years" size="1" maxlength="2" />
                <button>years</button>
            </div>
            <div id="filter-spinner" class="hide">
                <img src="images/spinner.gif" />
            </div>
            <div id="new-day-backdrop" class="hide"></div>
            <form id="new-day" method="POST">
                <fieldset>
                    <legend>
                        <span id="day-of-week"></span>
                        <input type="text" name="month" placeholder="month" maxlength="4" value="$month" />
                        <input type="text" name="day" placeholder="day" maxlength="4" value="$day" />
                        <input type="text" name="year" placeholder="year" maxlength="4" value="$year" />
                    </legend>
                    <div class="not-legend hide">
                        <input type="hidden" name="new" value="1" />
                        <button type="button" id="add-workout" class="pull-right">Add another workout</button>
                        <div class="workouts"></div>
                        <div class="input-row">
                            <textarea name="notes" placeholder="How was today?"></textarea>
                        </div>
                        <button type="submit" class="primary">Save</button>
                        <button type="button" id="cancel">Cancel</button>
                    </div>
                    <div class="add-day"></div>
                </fieldset>
            </form>
            <div id="calendar"></div>
            <ul id="legend"></ul>
            <ul id="days"></ul>
            <div class="days-fade top"></div>
            <div class="days-fade bottom"></div>
            <div id="tooltip" class="hide"></div>
    
            <script type="text/template" name="day">
                <li>
                    <div class="day">
                        <%= DAY %>
                    </div>
                    <% if (WORKOUTS) { %>
                        <ul class="workouts">
                            <% _.each(WORKOUTS, function(w) { %>
                                <li><%= w.DESCRIPTION %></li>
                            <% }) %>
                        </ul>
                    <% } %>
                    <div class="notes">
                        <%= NOTES %>
                    </div>
                </li>
            </script>

            <script type="text/template" name="record">
                <li>
                    <div class="activity <%= CLASS %>"><%= ACTIVITY %></div>
                    <ul class="records hide <%= CLASS %>">
                        <% _.each(RECORDS, function(r) { %>
                            <li>
                                <div class="description"><%= r.DESCRIPTION %></div>
                                <% if (r.DAY) { %>
                                    <div>(<%= r.DAY %>)</div>
                                <% } %>
                            </li>
                        <% }) %>
                    </ul>
                </li>
            </script>
    
            <script type="text/template" name="blank-workout">
                <div class="workout-row">
                    <button type="button" class="pull-right remove-workout">Remove workout</button>
                    <div class="pull-left">
                        <select class="new-activity" name="activity<%= index %>">
                            <option>running</option>
                            <option>bench press</option>
                            <option>chinups</option>
                            <option>cleans</option>
                            <option>crossfit</option>
                            <option>curls</option>
                            <option>deadlifts</option>
                            <option>erging</option>
                            <option>overhead press</option>
                            <option>squats</option>
                            <option>circuits</option>
                        </select>
                    </div>
                    <div class="pull-left">
                        <div class="input-row">
                            <input type="text" name="sets<%= index %>" placeholder="sets" />
                            <input type="text" name="reps<%= index %>" placeholder="reps" />
                            <input type="text" name="weight<%= index %>" placeholder="weight" />
                        </div>
                        <div class="input-row">
                            <input type="text" name="distance<%= index %>" placeholder="distance" />
                            <select name="unit<%= index %>">
                                <option>mi</option>
                                <option>km</option>
                                <option>m</option>
                            </select>
                            <input type="text" name="time<%= index %>" placeholder="time" />
                            <span class="pace"></span>
                        </div>
                    </div>
                </div>
            </script>
    	</body>
    </html>
};

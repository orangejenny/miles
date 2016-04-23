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
            <script data-main="script/main" src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js"></script>
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
        </body>
    </html>
};

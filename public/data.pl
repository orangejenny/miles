#!/usr/bin/perl

use lib "..";
use strict;

use Miles;
use CGI;
use JSON;

my $cgi = CGI->new;
my $dbh = Miles::DBH();

print $cgi->header(-type => 'text/text');

my @rows = Miles::Results($dbh, {
    SQL => qq{
        select
            days.id, days.day, days.notes,
            workouts.id, workouts.activity, workouts.time, workouts.distance, workouts.sets, workouts.reps, workouts.weight, workouts.unit
        from
            days, workouts
        where
            days.id = workouts.day_id
            and days.day > subdate(now(), interval 1 year)
        order by
            days.day desc, days.id
    },
    COLUMNS => [qw(id day notes workoutid activity time distance sets reps weight unit)],
});

my $day = {};
my @days = ();
foreach my $row (@rows) {
    if ($row->{ID} != $day->{ID}) {
        if ($day->{ID}) {
            push(@days, $day);
        }
        $day = {
            ID => $row->{ID},
            DAY => $row->{DAY},
            NOTES => $row->{NOTES},
            WORKOUTS => [],
        };
    }
    my $workout = {
        ID => $row->{WORKOUTID},
        ACTIVITY => $row->{ACTIVITY},
        TIME => $row->{TIME},
        DISTANCE => $row->{DISTANCE},
        SETS => $row->{SETS},
        REPS => $row->{REPS},
        WEIGHT => $row->{WEIGHT},
        UNIT => $row->{UNIT},
    };
    push(@{ $day->{WORKOUTS} }, $workout);
}
if ($day->{ID}) {
    push(@days, $day);
}

print to_json(\@days);

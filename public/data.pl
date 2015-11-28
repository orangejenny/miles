#!/usr/bin/perl

use lib "..";
use strict;

use Miles;
use CGI;
use JSON;
use Data::Dumper;

my $cgi = CGI->new;
my $dbh = Miles::DBH();

print $cgi->header(-type => 'text/text');

my @workouts = Miles::Results($dbh, {
    SQL => "select id, day_id, activity from workouts",
    COLUMNS => [qw(id dayid activity)],
});

my %workoutsbydayid = map { $_->{DAYID} => [] } @workouts;
foreach my $workout (@workouts) {
    push(@{ $workoutsbydayid{$workout->{DAYID} }}, $workout);
}

my @days = Miles::Results($dbh, {
    SQL => "select id, day, notes from days",
    COLUMNS => [qw(id day notes)],
});

foreach my $day (@days) {
    $day->{WORKOUTS} = $workoutsbydayid{$day->{ID}} || [];
}

print to_json(\@days);

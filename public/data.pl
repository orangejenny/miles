#!/usr/bin/perl

use lib "..";
use strict;

use Miles;
use CGI;
use JSON;

my $cgi = CGI->new;
my $dbh = Miles::DBH();
my $fdat = Miles::Fdat();

print $cgi->header(-type => 'text/text');

my @days = Miles::ListDays($dbh, {
    MIN => $fdat->{MIN},
});
print encode_json(\@days);

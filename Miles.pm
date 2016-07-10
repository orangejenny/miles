package Miles;

use strict;
use DBI;
use YAML;

sub Config {
	return YAML::LoadFile("../config.yml");
}

################################################################
# AddDay
#
# Description: Add a new day and its workouts
#
# Parameters:
#   DAY: string
#   NOTES: string
#   WORKOUTS: arrayref of hashrefs
#
# Return Value: Error message, or blank string if successful.
################################################################
sub AddDay {
    my ($dbh, $args) = @_;
    my $error = "";

    # TODO: transaction for all of this
    my @existing = Miles::Results($dbh, {
        SQL => "select id from days where day = ?",
        BINDS => [$args->{DAY}],
        COLUMNS => ['id'],
    });
    if (scalar(@existing)) {
        return sprintf("Duplicate entry; there is already an entry for %s.", $args->{DAY});
    }

    my $sql = qq{
        insert into days (day, notes, created_at, updated_at)
        values (?, ?, now(), now())
    };
    Miles::Results($dbh, {
        SQL => $sql,
        BINDS => [$args->{DAY}, $args->{NOTES}],
        SKIPFETCH => 1,
    });
    my @dayids = Miles::Results($dbh, {
        SQL => "select max(id) from days",
        COLUMNS => ['id'],
    });
    my $dayid = @dayids[0]->{ID};

    foreach my $workout (@{ $args->{WORKOUTS} }) {
        my @columns = ('day_id');
        my @binds = ($dayid);
        foreach my $column (map { uc $_ } qw(activity time distance sets reps weight unit)) {
            if ($workout->{$column}) {
                push(@columns, lc $column);
                push(@binds, $workout->{$column});
            }
        }
        Miles::Results($dbh, {
            SQL => sprintf(
                "insert into workouts (%s, created_at, updated_at) values (%s, now(), now())",
                join(", ", @columns),
                join(", ", map { '?' } @binds),
            ),
            BINDS => \@binds,
            SKIPFETCH => 1,
        });
    }

    return $error;
}

################################################################
# ListDays
#
# Description: Fetch a range of days, along with their workouts
#
# Parameters:
#   MIN: Minimum date, as a YYYY-MM-DD string
#
# Return Value: Array or arrayref of hashrefs
################################################################
sub ListDays {
    my ($dbh, $args) = @_;

    my @rows = Miles::Results($dbh, {
        SQL => qq{
            select
                days.id, days.day, days.notes,
                workouts.id, workouts.activity, workouts.time, workouts.distance, workouts.sets, workouts.reps, workouts.weight, workouts.unit
            from
                days, workouts
            where
                days.id = workouts.day_id
                and days.day > ?
            order by
                days.day desc, days.id
        },
        BINDS => [$args->{MIN}],
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

    return wantarray ? @days : \@days;
}

################################################################
# DBH
#
# Description: Create database handle
#
# Return Value: $dbh
################################################################
sub DBH {
	my $config = Config->{db};

	my $host = $config->{host};
	my $database = $config->{database};
	my $user = $config->{user};
	my $password = $config->{password};

	return DBI->connect("dbi:mysql:host=$host:$database", $user, $password) or die $DBI::errstr;
}

################################################################
# EscapeHTMLAttribute
#
# Description: Escape a given string for use as an HTML attribute
#
# Params: string
#
# Return Value: string
################################################################
sub EscapeHTMLAttribute {
	my $string = shift;
	$string =~ s/"/&quot;/g;
	return $string;
}

################################################################
# Fdat
#
# Description: Builds hashref of GET/POST params
#
# Params: none
#
# Return Value: hashref
################################################################
sub Fdat {
	my $q = CGI->new;
	my $fdat;


	# GET
	foreach my $key ($q->url_param()) {
		my $value = $q->url_param($key);
		$fdat->{uc($key)} = $value;
	}

	# POST (will override GET in conflicts)
	foreach my $key ($q->param()) {
		my $value = $q->param($key);
		$fdat->{uc($key)} = $value;
	}

	return $fdat;
}

################################################################
# Results
#
# Description: Execute query
#
# Parameters
#		SQL: query string
#		COLUMNS: arrayref of names for the fetched elements
#		BINDS (optional)
#		SKIPFETCH: (optional) denotes a non-select query
#
# Return Value: array of hashrefs
################################################################
sub Results {
	my ($dbh, $args) = @_;

	my @binds = $args->{BINDS} ? @{ $args->{BINDS} } : ();

	my $sql = $args->{SQL};
	my $query = $dbh->prepare($sql) or die "PREPARE: $DBI::errstr ($sql)";
	$query->execute(@binds) or die "EXECUTE: $DBI::errstr ($sql)";

	my @results;
	my @columns = $args->{COLUMNS} ? @{ $args->{COLUMNS} } : ();
	while (!$args->{SKIPFETCH} && (my @row = $query->fetchrow())) {
		my %labeledrow;
		for (my $i = 0; $i < @columns; $i++) {
			$labeledrow{uc($columns[$i])} = $row[$i];
		}
		push @results, \%labeledrow;
	}
	$query->finish();

	return @results;
}

1;

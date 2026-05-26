<?php

use App\Models\OrganizationMember;
use App\Models\User;

// Find all organization_members whose user no longer exists
$orphaned = OrganizationMember::whereNotIn('user_id', User::pluck('id'))->get();

echo "Found " . $orphaned->count() . " orphaned membership record(s).\n";

foreach ($orphaned as $record) {
    echo "Deleting orphaned record: user_id=" . $record->user_id . " status=" . $record->status . "\n";
    $record->delete();
}

echo "Cleanup complete!\n";

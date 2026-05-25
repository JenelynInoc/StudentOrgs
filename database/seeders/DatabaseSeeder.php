<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Call AdminSeeder
        $this->call(AdminSeeder::class);

        // Create Test Users
        $user1 = User::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@soms.local',
            'password' => Hash::make('password123'),
            'student_id' => 'STU-2026-001',
            'is_suspended' => false,
        ]);

        $user2 = User::create([
            'name' => 'Bob Smith',
            'email' => 'bob@soms.local',
            'password' => Hash::make('password123'),
            'student_id' => 'STU-2026-002',
            'is_suspended' => false,
        ]);

        $user3 = User::create([
            'name' => 'Charlie Wilson',
            'email' => 'charlie@soms.local',
            'password' => Hash::make('password123'),
            'student_id' => 'STU-2026-003',
            'is_suspended' => false,
        ]);

        // Create Organizations
        $org1 = Organization::create([
            'name' => 'Computer Science Society',
            'description' => 'Club for CS enthusiasts',
            'status' => 'active',
        ]);

        $org2 = Organization::create([
            'name' => 'Engineering Club',
            'description' => 'Building and creating',
            'status' => 'active',
        ]);

        $org3 = Organization::create([
            'name' => 'Business Leaders',
            'description' => 'Future business professionals',
            'status' => 'active',
        ]);
    }
}


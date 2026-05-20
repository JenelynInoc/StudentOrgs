<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::create([
            'name' => 'Super Admin',
            'email' => 'admin@soms.local',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
        ]);

        Admin::create([
            'name' => 'Admin User',
            'email' => 'admin2@soms.local',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
}

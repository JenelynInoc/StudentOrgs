<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admins
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@school.edu',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Create Categories
        $categories = [
            'Academic' => 'Organizations focused on specific academic majors and honor societies.',
            'Sports & Recreation' => 'Clubs centered around physical training, games, and athletic competitions.',
            'Arts & Culture' => 'Organizations celebrating visual, performing arts, and diverse cultural groups.',
            'Technology & Science' => 'Clubs exploring software, engineering, robotics, and scientific research.',
        ];

        $categoryModels = [];
        foreach ($categories as $name => $desc) {
            $categoryModels[] = \App\Models\Category::create([
                'name' => $name,
                'description' => $desc,
            ]);
        }

        // 3. Create Organizations
        $org1 = \App\Models\Organization::create([
            'name' => 'Computer Science Society',
            'acronym' => 'CSS',
            'description' => 'The ultimate club for coding enthusiasts, game developers, and hardware builders.',
            'category_id' => $categoryModels[3]->id, // Tech & Science
            'status' => 'active',
        ]);

        $org2 = \App\Models\Organization::create([
            'name' => 'University Debate Coalition',
            'acronym' => 'UDC',
            'description' => 'Developing public speaking, critical thinking, and argumentative prowess.',
            'category_id' => $categoryModels[0]->id, // Academic
            'status' => 'active',
        ]);

        $org3 = \App\Models\Organization::create([
            'name' => 'Varsity Soccer Club',
            'acronym' => 'VSC',
            'description' => 'Providing training, local league matches, and recreational play for soccer lovers.',
            'category_id' => $categoryModels[1]->id, // Sports & Rec
            'status' => 'active',
        ]);

        // 4. Create Officers
        $officer1 = User::create([
            'name' => 'John Doe',
            'email' => 'officer@school.edu',
            'password' => bcrypt('password'),
            'role' => 'officer',
        ]);

        $officer2 = User::create([
            'name' => 'Jane Smith',
            'email' => 'officer2@school.edu',
            'password' => bcrypt('password'),
            'role' => 'officer',
        ]);

        $officer3 = User::create([
            'name' => 'Mark Wilson',
            'email' => 'officer3@school.edu',
            'password' => bcrypt('password'),
            'role' => 'officer',
        ]);

        // Assign Officers to Orgs
        \App\Models\Membership::create([
            'user_id' => $officer1->id,
            'organization_id' => $org1->id,
            'role' => 'officer',
            'officer_title' => 'President',
            'status' => 'approved',
        ]);

        // Also assign officer1 to org2 and org3 to make testing all organizations with officer@school.edu extremely easy
        \App\Models\Membership::create([
            'user_id' => $officer1->id,
            'organization_id' => $org2->id,
            'role' => 'officer',
            'officer_title' => 'Adviser',
            'status' => 'approved',
        ]);

        \App\Models\Membership::create([
            'user_id' => $officer1->id,
            'organization_id' => $org3->id,
            'role' => 'officer',
            'officer_title' => 'Coach',
            'status' => 'approved',
        ]);

        \App\Models\Membership::create([
            'user_id' => $officer2->id,
            'organization_id' => $org2->id,
            'role' => 'officer',
            'officer_title' => 'President',
            'status' => 'approved',
        ]);

        \App\Models\Membership::create([
            'user_id' => $officer3->id,
            'organization_id' => $org3->id,
            'role' => 'officer',
            'officer_title' => 'President',
            'status' => 'approved',
        ]);

        // 5. Create Students
        $student1 = User::create([
            'name' => 'Alice Johnson',
            'email' => 'student@school.edu',
            'password' => bcrypt('password'),
            'role' => 'student',
            'student_id' => 'STUD-2026-0001',
        ]);

        $student2 = User::create([
            'name' => 'Bob Miller',
            'email' => 'student2@school.edu',
            'password' => bcrypt('password'),
            'role' => 'student',
            'student_id' => 'STUD-2026-0002',
        ]);

        // Student Memberships
        \App\Models\Membership::create([
            'user_id' => $student1->id,
            'organization_id' => $org1->id,
            'role' => 'member',
            'status' => 'approved',
        ]);

        \App\Models\Membership::create([
            'user_id' => $student2->id,
            'organization_id' => $org1->id,
            'role' => 'member',
            'status' => 'pending',
        ]);

        \App\Models\Membership::create([
            'user_id' => $student1->id,
            'organization_id' => $org2->id,
            'role' => 'member',
            'status' => 'approved',
        ]);

        // 6. Create Events
        $event1 = \App\Models\Event::create([
            'organization_id' => $org1->id,
            'title' => 'Hackathon 2026',
            'description' => 'A 24-hour coding sprint to solve real-world problems. Free pizza and merchandise included!',
            'location' => 'Science & Technology Hall, Room 402',
            'start_time' => now()->addDays(5)->setHour(9)->setMinute(0),
            'end_time' => now()->addDays(6)->setHour(9)->setMinute(0),
            'status' => 'scheduled',
        ]);

        $event2 = \App\Models\Event::create([
            'organization_id' => $org1->id,
            'title' => 'Introduction to Laravel & React',
            'description' => 'Learn how to build modern web APIs and connect them to React frontend applications.',
            'location' => 'Virtual (Zoom)',
            'start_time' => now()->addDays(2)->setHour(14)->setMinute(0),
            'end_time' => now()->addDays(2)->setHour(16)->setMinute(0),
            'status' => 'scheduled',
        ]);

        $event3 = \App\Models\Event::create([
            'organization_id' => $org2->id,
            'title' => 'Annual Debate Championship',
            'description' => 'Watch the top debaters face off on pressing geopolitical and economic policies.',
            'location' => 'Main Auditorium',
            'start_time' => now()->addDays(10)->setHour(13)->setMinute(0),
            'end_time' => now()->addDays(10)->setHour(18)->setMinute(0),
            'status' => 'scheduled',
        ]);

        // RSVP/Participations
        \App\Models\EventParticipation::create([
            'event_id' => $event1->id,
            'user_id' => $student1->id,
            'status' => 'registered',
        ]);

        \App\Models\EventParticipation::create([
            'event_id' => $event2->id,
            'user_id' => $student1->id,
            'status' => 'attended',
        ]);

        // 7. Create Announcements
        \App\Models\Announcement::create([
            'organization_id' => $org1->id,
            'title' => 'Hackathon Registrations Open!',
            'content' => 'Registration for Hackathon 2026 is officially open. Form teams of up to 4 members and sign up before the deadline next week.',
            'posted_by' => $officer1->id,
        ]);

        \App\Models\Announcement::create([
            'organization_id' => $org2->id,
            'title' => 'Weekly Debate Practice Schedule',
            'content' => 'Join us every Wednesday at 4:00 PM in Seminar Room B for our mock debates and feedback sessions.',
            'posted_by' => $officer2->id,
        ]);
    }
}

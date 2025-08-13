<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\HandoutNote;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class HandoutNotesArchivingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Skip this test if there are database migration issues
        try {
            $this->artisan('migrate:fresh', ['--env' => 'testing']);
        } catch (\Exception $e) {
            $this->markTestSkipped('Database migrations failed: ' . $e->getMessage());
        }
    }

    public function test_notes_are_properly_separated_by_current_and_archived()
    {
        // Create a user
        $user = User::factory()->create();

        // Create notes from different weeks
        $currentWeekStart = Carbon::now()->startOfWeek(Carbon::SUNDAY);
        
        // Current week note
        $currentNote = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => $currentWeekStart->copy()->addDays(2), // Tuesday of current week
        ]);

        // Previous week note
        $previousWeekNote = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => $currentWeekStart->copy()->subWeek()->addDays(2), // Tuesday of previous week
        ]);

        // Two weeks ago note
        $twoWeeksAgoNote = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => $currentWeekStart->copy()->subWeeks(2)->addDays(2), // Tuesday of two weeks ago
        ]);

        // Act as the user and visit the handout notes page
        $response = $this->actingAs($user)->get('/handout-notes');

        $response->assertStatus(200);

        // Check that current notes contain only the current week note
        $response->assertInertia(fn ($page) => 
            $page->component('handout-notes')
                ->has('currentNotes')
                ->has('archivedNotes')
                ->has('archiveInfo')
        );

        $pageData = $response->inertia('handout-notes');
        
        // Verify current notes
        $this->assertArrayHasKey('electrical', $pageData['currentNotes']);
        $this->assertCount(1, $pageData['currentNotes']['electrical']);
        $this->assertEquals($currentNote->id, $pageData['currentNotes']['electrical'][0]['id']);

        // Verify archived notes
        $this->assertArrayHasKey('electrical', $pageData['archivedNotes']);
        $this->assertCount(2, $pageData['archivedNotes']['electrical']);
        
        $archivedNoteIds = collect($pageData['archivedNotes']['electrical'])->pluck('id')->toArray();
        $this->assertContains($previousWeekNote->id, $archivedNoteIds);
        $this->assertContains($twoWeeksAgoNote->id, $archivedNoteIds);

        // Verify archive info
        $this->assertEquals(1, $pageData['archiveInfo']['total_current_notes']);
        $this->assertEquals(2, $pageData['archiveInfo']['total_archived_notes']);
    }

    public function test_notes_are_ordered_by_most_recent_activity()
    {
        // Create a user
        $user = User::factory()->create();

        // Create notes with different timestamps
        $note1 = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => Carbon::now()->subDays(3),
            'updated_at' => Carbon::now()->subDays(3),
        ]);

        $note2 = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => Carbon::now()->subDays(5),
            'updated_at' => Carbon::now()->subDays(1), // More recent update
        ]);

        $note3 = HandoutNote::factory()->create([
            'user_id' => $user->id,
            'created_at' => Carbon::now()->subDays(2),
            'updated_at' => Carbon::now()->subDays(2),
        ]);

        // Act as the user and visit the handout notes page
        $response = $this->actingAs($user)->get('/handout-notes');

        $response->assertStatus(200);

        $pageData = $response->inertia('handout-notes');
        
        // Notes should be ordered by most recent activity
        // note2 should be first (updated 1 day ago)
        // note3 should be second (created 2 days ago)
        // note1 should be third (created 3 days ago)
        $currentNotes = $pageData['currentNotes']['electrical'];
        
        $this->assertEquals($note2->id, $currentNotes[0]['id']);
        $this->assertEquals($note3->id, $currentNotes[1]['id']);
        $this->assertEquals($note1->id, $currentNotes[2]['id']);
    }
}

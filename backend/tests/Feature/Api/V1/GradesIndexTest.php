<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradesIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_grades_with_stats(): void
    {
        $this->seed(); // GradeSubjectSeeder و ...

        $res = $this->getJson('/api/v1/grades?include=stats');
        $res->assertOk()
            ->assertJsonPath('code', 'OK')
            ->assertJsonStructure([
                'data' => [
                    ['id', 'name', 'stats' => ['books', 'chapters']]
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page']
            ]);
    }
}

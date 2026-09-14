<?php

namespace Database\Seeders;

use App\Models\Curriculum\Book;
use App\Models\Curriculum\Chapter;
use Illuminate\Database\Seeder;

class ChaptersTableSeeder extends Seeder
{
    public function run(): void
    {
        $books = Book::all();

        foreach ($books as $book) {
            for ($i = 1; $i <= 15; $i++) {
                Chapter::firstOrCreate(
                    ['book_id' => $book->id, 'number' => $i], // 👈 به‌جای order از number
                    ['title' => "فصل {$i}"]
                );
            }
        }
    }
}

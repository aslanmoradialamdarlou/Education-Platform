<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoreCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // پایه‌ها
        $grades = [
            ['id'=>1, 'name'=>'هفتم'],
            ['id'=>2, 'name'=>'هشتم'],
            ['id'=>3, 'name'=>'نهم'],
        ];
        foreach ($grades as $g) {
            DB::table('grades')->updateOrInsert(['id'=>$g['id']], ['name'=>$g['name']]);
        }

        // یک Subject «علوم»
        $subjectId = DB::table('subjects')->updateOrInsert(
            ['name'=>'علوم'],
            ['name'=>'علوم']
        );
        $subjectId = DB::table('subjects')->where('name','علوم')->value('id');

        // برای هر پایه یک کتاب «علوم {پایه} – ۱۴۰۳»
        foreach ($grades as $g) {
            $bookId = DB::table('books')->updateOrInsert(
                ['subject_id'=>$subjectId,'grade_id'=>$g['id'],'year'=>1403],
                ['title'=>"علوم {$g['name']}", 'year'=>1403]
            );
            $bookId = DB::table('books')
                ->where(['subject_id'=>$subjectId,'grade_id'=>$g['id'],'year'=>1403])
                ->value('id');

            // ۱۵ فصل
            for ($i=1; $i<=15; $i++) {
                DB::table('chapters')->updateOrInsert(
                    ['book_id'=>$bookId,'number'=>$i],
                    ['title'=>"فصل {$i}"]
                );
            }
        }
    }
}

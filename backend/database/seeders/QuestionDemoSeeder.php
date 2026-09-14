<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Question\{Question, QuestionType, QuestionOption, QuestionPair, QuestionBlank, QuestionTag};
use App\Models\Curriculum\{Grade, Subject, Book, Chapter, Subchapter};

class QuestionDemoSeeder extends Seeder
{
    public function run(): void
    {
        // نوع‌ها
        $types = ['mcq','descriptive','short_answer','fill_blank','match'];
        $typeMap = [];
        foreach ($types as $nm) {
            $typeMap[$nm] = QuestionType::firstOrCreate(['name'=>$nm])->id;
        }

        // اطمینان از وجود یک ساختار پایه/کتاب/فصل/زیر‌فصل
        $grade = Grade::first() ?? Grade::create(['name'=>'هفتم']);
        $subject = Subject::first() ?? Subject::create(['name'=>'علوم']);
        $book = Book::first() ?? Book::create([
            'grade_id'=>$grade->id,'subject_id'=>$subject->id,'title'=>'علوم هفتم','year'=>1403
        ]);

        $chapter = Chapter::first() ?? Chapter::create(['book_id'=>$book->id,'name'=>'فصل نمونه','order'=>1]);
        $subchapter = Subchapter::first() ?? Subchapter::create(['chapter_id'=>$chapter->id,'name'=>'زیر فصل 1','order'=>1]);

        // چند تگ
        $tags = collect(['حرکت','نیرو','انرژی','فشار','چگالی'])->map(function($name){
            return QuestionTag::firstOrCreate(['slug'=>Str::slug($name)],['name'=>$name])->id;
        })->all();

        $difficulties = [null,'easy','medium','hard'];

        $total = 200; // بین 100 تا 300
        for ($i=1; $i<=$total; $i++) {
            $kind = $types[array_rand($types)];
            $q = Question::create([
                'type_id'       => $typeMap[$kind],
                'subchapter_id' => $subchapter->id,
                'difficulty'    => $difficulties[array_rand($difficulties)],
                'source'        => 'کتاب درسی',
                'book_page'     => rand(10, 120),
                'question_text' => "سؤال {$i} از نوع {$kind} — توضیح مختصر ...",
                'answer_text'   => in_array($kind,['descriptive','short_answer']) ? 'پاسخ نمونه.' : null,
                'status'        => rand(0,1) ? 'published' : 'draft',
                'is_free'       => (bool)rand(0,1),
            ]);

            // برچسب‌ها تصادفی
            $pick = collect($tags)->shuffle()->take(rand(0,3))->all();
            if (!empty($pick)) $q->tags()->sync($pick);

            // دیتای نوع‌محور
            if ($kind === 'mcq') {
                $correctIndex = rand(0,3);
                foreach (['A','B','C','D'] as $idx=>$label) {
                    $q->options()->create([
                        'label'=>$label,
                        'text'=>"گزینه {$label} برای سؤال {$i}",
                        'is_correct'=> $idx===$correctIndex,
                    ]);
                }
            } elseif ($kind === 'match') {
                for ($j=1; $j<=4; $j++) {
                    $q->pairs()->create([
                        'left_text'=>"گزینه چپ {$j}",
                        'right_text'=>"گزینه راست {$j}",
                        'match_key'=>"K{$j}",
                    ]);
                }
            } elseif ($kind === 'fill_blank') {
                $blanks = rand(1,3);
                for ($j=1; $j<=$blanks; $j++) {
                    $q->blanks()->create([
                        'blank_index'=>$j,
                        'correct_text'=>"پرکردنی {$j}",
                    ]);
                }
            }
        }
    }
}

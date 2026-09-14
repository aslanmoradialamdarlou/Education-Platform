<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class QuestionBankSeeder extends Seeder
{
    public function run(): void
    {
        // --- Question Types ---
        $types = [
            ['name' => 'Multiple Choice'],
            ['name' => 'Descriptive'],
            ['name' => 'Short Answer'],
            ['name' => 'Fill in the Blank'],
            ['name' => 'Matching'],
        ];
        DB::table('question_types')->insert($types);

        // --- Tags ---
        $tags = ['ریاضی', 'علوم', 'هفتم', 'سخت', 'آسان'];
        foreach ($tags as $t) {
            DB::table('question_tags')->insert([
                'name' => $t,
                'slug' => Str::slug($t)
            ]);
        }

        // گرفتن id ها
        $typeIds = DB::table('question_types')->pluck('id','name');
        $tagIds = DB::table('question_tags')->pluck('id','name');

        // --- Sample Questions ---
        // 1) Multiple Choice
        $q1 = DB::table('questions')->insertGetId([
            'type_id' => $typeIds['Multiple Choice'],
            'subchapter_id' => 1, // باید موجود باشه در دیتابیس
            'difficulty' => 'easy',
            'source' => 'کتاب درسی',
            'book_page' => 12,
            'question_text' => 'کدام یک از موارد زیر یک عدد اول است؟',
            'answer_text' => 'عدد 7 عدد اول است.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('question_options')->insert([
            ['question_id' => $q1,'label'=>'A','text'=>'4','is_correct'=>false],
            ['question_id' => $q1,'label'=>'B','text'=>'6','is_correct'=>false],
            ['question_id' => $q1,'label'=>'C','text'=>'7','is_correct'=>true],
            ['question_id' => $q1,'label'=>'D','text'=>'9','is_correct'=>false],
        ]);
        DB::table('question_tag_pivot')->insert([
            ['question_id'=>$q1,'tag_id'=>$tagIds['ریاضی']],
            ['question_id'=>$q1,'tag_id'=>$tagIds['هفتم']],
            ['question_id'=>$q1,'tag_id'=>$tagIds['آسان']],
        ]);

        // 2) Descriptive
        $q2 = DB::table('questions')->insertGetId([
            'type_id' => $typeIds['Descriptive'],
            'subchapter_id' => 1,
            'difficulty' => 'medium',
            'source' => 'نمونه سوال امتحانی',
            'question_text' => 'فرایند فتوسنتز را توضیح دهید.',
            'answer_text' => 'گیاهان با استفاده از نور خورشید، آب و دی‌اکسید کربن قند تولید می‌کنند.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('question_tag_pivot')->insert([
            ['question_id'=>$q2,'tag_id'=>$tagIds['علوم']],
            ['question_id'=>$q2,'tag_id'=>$tagIds['هفتم']],
            ['question_id'=>$q2,'tag_id'=>$tagIds['سخت']],
        ]);

        // 3) Fill in the Blank
        $q3 = DB::table('questions')->insertGetId([
            'type_id' => $typeIds['Fill in the Blank'],
            'subchapter_id' => 1,
            'difficulty' => 'easy',
            'source' => 'کاربرگ تمرینی',
            'question_text' => 'تهران پایتخت _____ است.',
            'answer_text' => 'ایران',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('question_blanks')->insert([
            'question_id'=>$q3,
            'blank_index'=>1,
            'correct_text'=>'ایران',
        ]);

        // 4) Matching
        $q4 = DB::table('questions')->insertGetId([
            'type_id' => $typeIds['Matching'],
            'subchapter_id' => 1,
            'difficulty' => 'hard',
            'source' => 'نمونه سوالات ترکیبی',
            'question_text' => 'ستون A را به ستون B وصل کنید.',
            'answer_text' => 'A1→B2, A2→B1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('question_pairs')->insert([
            ['question_id'=>$q4,'left_text'=>'فرانسه','right_text'=>'پاریس','match_key'=>'A1'],
            ['question_id'=>$q4,'left_text'=>'آلمان','right_text'=>'برلین','match_key'=>'A2'],
        ]);
    }
}

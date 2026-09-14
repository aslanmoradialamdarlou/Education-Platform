<?php
// app/Services/Exam/ExamPdfService.php

namespace App\Services\Exam;

use App\Models\Exam\Exam;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class ExamPdfService
{
    /**
     * Render and store Exam PDF (exam sheet or answer key)
     *
     * $opts:
     *  - mode: 'exam' | 'answer_key'
     *  - with_answers: bool (برای برگه‌ی سوالات، پاسخ‌ها را هم چاپ کن)
     */
    public function render(Exam $exam, array $opts = []): array
    {
        $mode        = $opts['mode']         ?? 'exam';        // exam | answer_key
        $withAnswers = (bool)($opts['with_answers'] ?? false);

        // داده‌ها و روابط لازم
        $exam->load(['items.question.type', 'items.question.options', 'headerTemplate']);

        // ترتیب سؤالات یکجا از DB (از N+1 در Blade جلوگیری می‌کند)
        $items = $exam->items()->orderBy('order_number')->get();

        // Layout از مدل (cast=array)
        $layout = $exam->layout ?? [
            'paper_size'  => 'a4',
            'orientation' => 'portrait',
            'font_family' => 'vazirmatn',
            'font_size'   => 12,
            'line_spacing'=> 1.6,
            'numbering'   => '1.',
        ];

        // Header/Footer سفارشی (اختیاری)
        $header_html = $exam->headerTemplate->template_header_html ?? null;
        $footer_html = $exam->headerTemplate->template_footer_html ?? null;

        // انتخاب ویو
        $view = $mode === 'answer_key' ? 'pdf.exam_answer_key' : 'pdf.exam';

        // رندر PDF
        $paper       = strtolower($layout['paper_size'] ?? 'a4');
        $orientation = $layout['orientation'] ?? 'portrait';

        $pdf = Pdf::loadView($view, compact(
            'exam',
            'items',
            'layout',
            'withAnswers',
            'header_html',
            'footer_html'
        ))->setPaper($paper, $orientation);

        // ذخیره در public disk
        $dir  = 'exams/' . now()->format('Y/m');
        $name = 'exam-' . $exam->id . '-' . time() . ($mode === 'answer_key' ? '-answers' : '') . '.pdf';

        Storage::disk('public')->put("$dir/$name", $pdf->output());
        $url = asset('storage/' . "$dir/$name");

        // ثبت خروجی
        $export = $exam->exports()->create([
            'file_url' => $url,
        ]);

        return ['url' => $url, 'export_id' => $export->id];
    }
}

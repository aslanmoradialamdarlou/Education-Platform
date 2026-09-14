<?php

namespace App\Jobs;

use App\Models\Question\QuestionImport;
use App\Services\Questions\QuestionImporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ImportQuestionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1200; // 20min
    public function __construct(public int $importId) {}

    public function handle(QuestionImporter $importer): void
    {
        $import = QuestionImport::findOrFail($this->importId);
        $import->update(['status'=>'processing','started_at'=>now()]);

        try {
            $importer->run($import); // پردازش chunkای و به‌روزرسانی progress
            $import->update(['status'=>'completed','finished_at'=>now()]);
        } catch (\Throwable $e) {
            $errs = $import->errors_json ?? [];
            $errs[] = ['row'=>null,'error'=>$e->getMessage()];
            $import->update([
                'status'       => 'failed',
                'errors_json'  => $errs,
                'finished_at'  => now(),
            ]);
            throw $e;
        }
    }
}

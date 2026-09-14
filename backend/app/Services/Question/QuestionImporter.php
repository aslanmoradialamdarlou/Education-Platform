<?php
namespace App\Services\Question;

use App\Models\Question\QuestionImport;
use Illuminate\Support\Facades\DB;
use SplFileObject;

class QuestionImporter
{
    public function run(QuestionImport $import): void
    {
        $path = storage_path('app/'.$import->file_path);
        $csv  = new SplFileObject($path);
        $csv->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $csv->setCsvControl(',');

        $header = null;
        $rowNum = 0;
        $success = 0;
        $errors  = $import->errors_json ?? [];

        // شمارش تقریبی (اختیاری) → یا از روش‌های دیگر استفاده کن
        $total = 0;
        foreach (new SplFileObject($path) as $_) { $total++; }
        $total = max(0, $total - 1); // بدون هدر
        $import->update(['total_rows' => $total]);

        foreach ($csv as $row) {
            if ($row === [null] || $row === false) continue;

            $rowNum++;
            if ($rowNum === 1) {
                $header = $row;
                continue;
            }

            try {
                $data = $this->mapRow($header, $row);
                DB::transaction(fn() => (new QuestionRowHandler())->store($data));
                $success++;
            } catch (\Throwable $e) {
                $errors[] = ['row'=>$rowNum,'error'=>$e->getMessage()];
                $import->increment('error_count');
            }

            $import->increment('processed_rows');
            if ($success % 50 === 0) {
                $import->update(['success_count' => $success, 'errors_json'=>$errors]);
            }
        }

        $import->update(['success_count'=>$success,'errors_json'=>$errors]);
    }

    private function mapRow(array $header, array $row): array
    {
        $assoc = [];
        foreach ($header as $i => $key) {
            $assoc[trim((string)$key)] = $row[$i] ?? null;
        }
        return $assoc;
    }
}

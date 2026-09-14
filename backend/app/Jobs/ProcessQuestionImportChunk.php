<?php

namespace App\Jobs;

use App\Models\ImportBatch;
use App\Models\ImportError;
use App\Services\Import\QuestionChunkImporter;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessQuestionImportChunk implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    /**
     * @param array $rows       The raw rows for this chunk.
     * @param int   $rowOffset  Starting row index (0-based) to compute absolute row numbers.
     */
    public function __construct(
        public array $rows,
        public int $rowOffset = 0
    ) {}

    public function handle(): void
    {
        // Batchable provides $this->batchId (string|null) and $this->batch()
        // Use the batchId to fetch your ImportBatch record if you keyed them the same.
        $importBatch = $this->batchId ? ImportBatch::find($this->batchId) : null;

        if (! $importBatch) {
            // Either this job isn't part of a Bus batch, or ImportBatch wasn’t created.
            return;
        }

        $processed = 0;
        $errors    = 0;

        foreach ($this->rows as $idx => $row) {
            try {
                app(QuestionChunkImporter::class)->importRow($row);
                $processed++;
            } catch (\Throwable $e) {
                $errors++;

                ImportError::create([
                    'batch_id' => $importBatch->id,
                    'row_no'   => $this->rowOffset + $idx + 1, // make it 1-based for humans
                    'message'  => $e->getMessage(),
                    'payload'  => $row,
                ]);
            }
        }

        // Update counters on your ImportBatch model
        $importBatch->increment('rows_processed', $processed + $errors);
        $importBatch->increment('errors_count', $errors);

        // If the Bus batch is finished, close your ImportBatch as well (optional)
        $busBatch = $this->batch(); // Illuminate\Bus\Batch|null
        if ($busBatch && $busBatch->finished()) {
            if ($importBatch->status === 'processing') {
                $importBatch->update(['status' => 'finished']);
            }
        }
    }
}

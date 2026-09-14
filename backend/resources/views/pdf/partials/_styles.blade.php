<style>
    @page { margin: 80px 40px 70px 40px; }
    body {
        direction: rtl; text-align: right;
        font-family: '{{ $layout['font_family'] ?? 'vazirmatn' }}', DejaVu Sans, sans-serif;
        font-size: {{ $layout['font_size'] ?? 12 }}px;
        line-height: {{ $layout['line_spacing'] ?? 1.5 }};
    }
    header { position: fixed; top: -60px; left: 0; right: 0; text-align: center; }
    footer { position: fixed; bottom: -50px; left: 0; right: 0; text-align: center; font-size: 10px; }
    .question { margin-bottom: 14px; }
    .number { display: inline-block; min-width: 28px; }
    .options { margin-top: 6px; padding-right: 24px; }
    .option { margin: 2px 0; }
    .page-break { page-break-after: always; }
</style>

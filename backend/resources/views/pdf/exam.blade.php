{{-- resources/views/pdf/exam.blade.php --}}
    <!doctype html>
<html lang="fa" dir="rtl">
@php
    // ۱) ارقام فارسی
    $toFaDigits = static function (string $s): string {
        static $map = ['0'=>'۰','1'=>'۱','2'=>'۲','3'=>'۳','4'=>'۴','5'=>'۵','6'=>'۶','7'=>'۷','8'=>'۸','9'=>'۹'];
        return strtr($s, $map);
    };

    // ۲) تولید برچسب شماره سؤال
    // حالت‌های پشتیبانی‌شده: '1.' | '1)' | '۱.' | 'الف)'
    $makeLabel = static function (int $indexZeroBased, string $style) use ($toFaDigits): string {
        $n = $indexZeroBased + 1;
        return match ($style) {
            '1.'   => $n.'.',
            '1)'   => $n.')',
            '۱.'   => $toFaDigits((string)$n).'.',
            'الف)' => (function(int $i) {
                $alphabet = ['الف','ب','پ','ت','ث','ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی'];
                return ($alphabet[$i] ?? (string)($i+1)).')';
            })($indexZeroBased),
            default => $n.'.',
        };
    };

    $layout = $layout ?? []; // اطمینان از وجود
    $numbering = (string) ($layout['numbering'] ?? '1.');
@endphp

<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 24px; }
        body {
            font-family: "vazirmatn", sans-serif;
            direction: rtl;
            unicode-bidi: embed;
            font-size: {{ $layout['font_size'] ?? 12 }}pt;
            line-height: {{ $layout['line_spacing'] ?? 1.6 }};
        }
        .question { margin-bottom: 18px; }
        .number   { font-weight: bold; margin-left: 6px; }
        .options  { margin-top: 6px; }
        .header, .footer { text-align: center; }
    </style>
</head>
<body>

{{-- هدر سفارشی (اختیاری) --}}
@if(!empty($header_html))
    {!! $header_html !!}
@endif

<h2 class="header">{{ $exam->title }}</h2>

@foreach($items as $i => $item)
    @php $q = $item->question; @endphp

    <div class="question">
        <span class="number">{{ $makeLabel($i, $numbering) }}</span>
        <span class="text">{!! nl2br(e($q->question_text)) !!}</span>

        @if(optional($q->type)->name === 'Multiple Choice' && $q->options->count())
            <div class="options">
                @foreach($q->options as $opt)
                    @php
                        $lbl = $opt->label ?: chr(65 + $loop->index); // A/B/C... اگر label خالی بود
                    @endphp
                    <div>– {!! e($lbl) !!}) {!! nl2br(e($opt->text)) !!}</div>
                @endforeach
            </div>
        @endif

        @if(!empty($withAnswers))
            <div style="margin-top:8px">
                <strong>پاسخ:</strong>
                <div>{!! nl2br(e($q->answer_text)) !!}</div>
            </div>
        @endif
    </div>
@endforeach

@if(!empty($footer_html))
    {!! $footer_html !!}
@endif

</body>
</html>

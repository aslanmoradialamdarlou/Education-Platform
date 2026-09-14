<!doctype html>
<html lang="fa">
<head>
    <meta charset="utf-8">
    @include('pdf.partials._styles')
</head>
<body>
@if(!empty($header_html))
    <header>{!! $header_html !!}</header>
@endif

@if(!empty($footer_html))
    <footer>{!! $footer_html !!}</footer>
@endif

<h2 style="margin-top:0">{{ $exam->title }} — کلید پاسخ</h2>

<ol>
    @foreach($items as $i => $it)
        @php $q = $it->question; @endphp
        <li style="margin-bottom:10px">
            <div><strong>نوع:</strong> {{ $q->type?->name }}</div>

            @if($q->type?->name === 'Multiple Choice' && $q->options()->exists())
                @php $correct = $q->options->firstWhere('is_correct', true); @endphp
                <div><strong>گزینه صحیح:</strong> {{ $correct?->label ?: '—' }}</div>
            @endif

            @if($q->answer_text)
                <div><strong>پاسخ تشریحی:</strong> {!! nl2br(e($q->answer_text)) !!}</div>
            @endif
        </li>
    @endforeach
</ol>

</body>
</html>

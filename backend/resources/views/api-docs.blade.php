<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $info['title'] ?? 'API Docs' }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        :root { --bg:#0f172a; --card:#111827; --muted:#9ca3af; --text:#e5e7eb; --accent:#22d3ee; --chip:#1f2937; }
        body { margin:0; font-family:ui-sans-serif,system-ui,-apple-system; background:var(--bg); color:var(--text); }
        header { padding:28px 20px; border-bottom:1px solid #1f2937; position:sticky; top:0; background:linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,23,42,.92)); backdrop-filter: blur(8px);}
        .container { max-width:1100px; margin:0 auto; }
        h1 { margin:0 0 6px; font-size:28px; }
        .muted { color:var(--muted); }
        .row { display:flex; gap:14px; align-items:center; flex-wrap: wrap; }
        .pill { background:var(--chip); border:1px solid #1f2937; border-radius:999px; padding:6px 10px; font-size:12px; }
        .search { flex:1; min-width:240px; }
        input[type="search"] { width:100%; padding:12px 14px; border-radius:10px; border:1px solid #1f2937; background:#0b1220; color:var(--text); outline:none; }
        .group { margin:26px 0 18px; font-weight:700; font-size:18px; }
        .grid { display:grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap:12px; }
        @media (min-width: 900px){ .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .card { background:var(--card); border:1px solid #1f2937; border-radius:14px; padding:14px; display:flex; gap:12px; flex-direction:column; }
        .title { font-weight:700; display:flex; gap:8px; align-items:center; }
        .badges { display:flex; gap:6px; flex-wrap:wrap; }
        .badge { font-size:11px; padding:4px 8px; border-radius:999px; border:1px solid #243045; background:#0b1220; }
        .method { color:#a78bfa; }
        .path { font-family:ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background:#0b1220; padding:2px 6px; border-radius:6px; }
        .kv { font-size:13px; }
        .code { background:#0b1220; border:1px solid #1f2937; padding:10px; border-radius:10px; white-space:pre-wrap; overflow:auto; font-size:12px; }
        .row-between { display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .btn { cursor:pointer; padding:6px 10px; border-radius:8px; background:#0b1220; border:1px solid #23304a; color:var(--text); font-size:12px; }
        .tag { color:var(--accent); font-weight:600; }
        footer { color:var(--muted); padding:30px 0 60px; }
    </style>
</head>
<body>
<header>
    <div class="container">
        <h1>{{ $info['title'] ?? 'API Docs' }}</h1>
        <div class="muted">{{ $info['description'] ?? '' }}</div>
        <div class="row" style="margin-top:12px;">
            <span class="pill">Version: {{ $info['version'] ?? 'v1' }}</span>
            <span class="pill">Base URL: {{ $info['base_url'] ?? '' }}</span>
            <span class="pill">Auth: {{ $info['auth_note'] ?? 'Sanctum where marked' }}</span>
            <div class="search">
                <input id="q" type="search" placeholder="Search by name, path, tag, method...">
            </div>
        </div>
    </div>
</header>

<main class="container" style="padding: 18px 20px;">
    @foreach($grouped as $key => $routes)
        <div class="group">{{ $groups[$key] ?? ucfirst($key) }}</div>
        <div class="grid">
            @foreach($routes as $r)
                @php
                    $doc = $r['doc'];
                    $title = $doc['title'] ?? ($r['name'] ?? $r['uri']);
                    $summary = $doc['summary'] ?? null;
                    $desc = $doc['description'] ?? null;
                    $methods = array_values(array_filter($r['methods'], fn($m)=>$m!=='HEAD'));
                @endphp
                <article class="card" data-index="{{ strtolower(($r['name'] ?? '').' '.$r['uri'].' '.implode(' ',$methods).' '.($r['tag'] ?? '')) }}">
                    <div class="row-between">
                        <div class="title">
                            <span>{{ $title }}</span>
                            @if($r['auth']) <span class="badge">Sanctum</span> @endif
                            @if($r['admin']) <span class="badge">role:admin</span> @endif
                            @if($r['tag']) <span class="badge">{{ $r['tag'] }}</span> @endif
                        </div>
                        <div class="badges">
                            @foreach($methods as $m)
                                <span class="badge method">{{ $m }}</span>
                            @endforeach
                        </div>
                    </div>

                    <div class="kv"><span class="path">{{ $r['uri'] }}</span></div>
                    @if($r['name']) <div class="kv muted">name: {{ $r['name'] }}</div> @endif
                    @if($summary) <div class="kv">{{ $summary }}</div> @endif
                    @if($desc)    <div class="kv muted">{{ $desc }}</div> @endif

                    @if(!empty($doc['params']))
                        <div class="kv"><strong>Params:</strong></div>
                        <div class="code">@json($doc['params'], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)</div>
                    @endif

                    @if(!empty($doc['request']))
                        <div class="kv"><strong>Request sample:</strong> <button class="btn" onclick="copyNext(this)">Copy</button></div>
                        <div class="code">{{ json_encode($doc['request'], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</div>
                    @endif

                    @if(!empty($doc['response']))
                        <div class="kv"><strong>Response sample:</strong> <button class="btn" onclick="copyNext(this)">Copy</button></div>
                        <div class="code">{{ json_encode($doc['response'], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</div>
                    @endif

                    @if(!empty($doc['notes']))
                        <div class="kv muted">{{ $doc['notes'] }}</div>
                    @endif
                </article>
            @endforeach
        </div>
    @endforeach

    <footer>Generated from Laravel routes + <code>config/apidocs.php</code>.</footer>
</main>

<script>
    const q = document.getElementById('q');
    q.addEventListener('input', () => {
        const term = q.value.toLowerCase().trim();
        document.querySelectorAll('article.card').forEach(card => {
            const idx = card.getAttribute('data-index') || '';
            card.style.display = idx.includes(term) ? '' : 'none';
        });
    });

    function copyNext(btn){
        const code = btn.parentElement.nextElementSibling;
        const txt  = code.innerText;
        navigator.clipboard.writeText(txt).then(() => {
            btn.innerText = 'Copied!';
            setTimeout(()=>btn.innerText='Copy', 1000);
        });
    }
</script>
</body>
</html>

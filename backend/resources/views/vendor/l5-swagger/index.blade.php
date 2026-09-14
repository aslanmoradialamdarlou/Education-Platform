<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Edu Platform API</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- Use CDN assets to avoid /docs/asset/* route -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css">
    <style>body{margin:0}</style>
</head>
<body>
<div id="swagger-ui"></div>

<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
<script>
    window.onload = () => {
        window.ui = SwaggerUIBundle({
            // Use L5-Swagger's JSON route:
            url: "{{ route('l5-swagger.default.docs') }}", // typically /docs/api-docs.json
            dom_id: "#swagger-ui",
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout"
        });
    };
</script>
</body>
</html>

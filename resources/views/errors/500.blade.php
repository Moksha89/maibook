<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="{{ asset('assets_admin/css/main.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets_admin/css/mibook-theme.css') }}">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <title>Server error</title>
</head>
<body>
    <main class="container py-5">
        <div class="card shadow-sm mx-auto text-center" style="max-width: 32rem;">
            <div class="card-body p-5">
                <h1 class="display-4">500</h1>
                <h2 class="card-title">Something went wrong</h2>
                <p class="card-text">We could not complete your request. Please try again.</p>
                <a class="btn btn-primary" href="{{ url('/') }}">Return home</a>
            </div>
        </div>
    </main>
</body>
</html>

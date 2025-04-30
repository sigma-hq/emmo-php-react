<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'EMMO') }}</title>

        <!-- Favicon with green theme -->
        <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMzg5MzM4Ii8+PHBhdGggZD0iTTIwLjUgMTkuOEgyMkwyMCAxNEgxOEwxNiAxOS44SDE3LjVMMTcuOCAxOUgyMC4yTDIwLjUgMTkuOFpNMTguMiAxNi4yTDE5IDE4SDE4TDE4LjIgMTYuMlpNMTEuNSAxOS44SDEzTDExIDE0SDlMNyAxOS44SDguNUw4LjggMTlIMTEuMkwxMS41IDE5LjhaTTkuMiAxNi4yTDEwIDE4SDlMOS4yIDE2LjJaTTI0IDE0SDIyLjVWMTkuOEgyNFYxNFpNMTUgMTQuMkgxM1YxOS44SDE1QzE2LjcgMTkuOCAxOCAxOC41IDE4IDE3QzE4IDE1LjUgMTYuOCAxNC4yIDE1IDE0LjJaTTE1IDE4LjVIMTQuNVYxNS41SDE1QzE1LjggMTUuNSAxNi40IDE2LjEgMTYuNCAxN0MxNi40IDE3LjkgMTUuOCAxOC41IDE1IDE4LjVaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" type="image/svg+xml">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

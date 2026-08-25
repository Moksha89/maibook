@props([
    'title',
    'subtitle' => null,
    'buttonText' => null,
    'buttonModal' => null,
    'buttonIcon' => null,
    'buttonClass' => 'btn btn-primary',
])

<div class="premium-page-header">
    <div class="premium-page-header__left">
        <h4 class="premium-page-header__title">{{ $title }}</h4>
        @if($subtitle)
            <p class="premium-page-header__subtitle">{{ $subtitle }}</p>
        @endif
    </div>
    <div class="premium-page-header__actions">
        {{ $slot }}
        @if($buttonText)
        <button type="button" class="{{ $buttonClass }} premium-btn" data-bs-toggle="modal" data-bs-target="#{{ $buttonModal }}">
            @if($buttonIcon)<i class="fa {{ $buttonIcon }}"></i>@endif {{ $buttonText }}
        </button>
        @endif
    </div>
</div>

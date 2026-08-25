@props([
    'title' => null,
    'subtitle' => null,
    'padding' => true,
    'class' => '',
])

<div class="premium-card {{ $class }}">
    @if($title)
    <div class="premium-card__header">
        <h5 class="premium-card__title">{{ $title }}</h5>
        @if($subtitle)
        <p class="premium-card__subtitle">{{ $subtitle }}</p>
        @endif
    </div>
    @endif
    <div class="premium-card__body {{ $padding ? '' : 'premium-card__body--no-padding' }}">
        {{ $slot }}
    </div>
</div>

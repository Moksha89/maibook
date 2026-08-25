@props([
    'title',
    'value' => '0',
    'icon' => null,
    'iconColor' => 'primary',
    'trend' => null,
    'trendUp' => true,
    'subtitle' => null,
])

<div class="premium-stat-card">
    <div class="premium-stat-card__content">
        <p class="premium-stat-card__label">{{ $title }}</p>
        <h3 class="premium-stat-card__value">{{ $value }}</h3>
        @if($trend)
        <div class="premium-stat-card__trend {{ $trendUp ? 'trend--up' : 'trend--down' }}">
            <i class="fa {{ $trendUp ? 'fa-arrow-up' : 'fa-arrow-down' }}"></i>
            <span>{{ $trend }}</span>
        </div>
        @endif
        @if($subtitle)
        <p class="premium-stat-card__subtitle">{{ $subtitle }}</p>
        @endif
    </div>
    @if($icon)
    <div class="premium-stat-card__icon premium-stat-card__icon--{{ $iconColor }}">
        <i class="fa {{ $icon }}"></i>
    </div>
    @endif
</div>

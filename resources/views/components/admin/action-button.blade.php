@props([
    'type' => 'button',
    'href' => null,
    'icon' => null,
    'variant' => 'default',
    'size' => 'sm',
    'tooltip' => null,
    'modal' => null,
    'dataId' => null,
])

@php
$variantMap = [
    'default' => 'premium-action-btn--default',
    'primary' => 'premium-action-btn--primary',
    'danger' => 'premium-action-btn--danger',
    'success' => 'premium-action-btn--success',
    'warning' => 'premium-action-btn--warning',
    'edit' => 'premium-action-btn--primary',
    'delete' => 'premium-action-btn--danger',
    'view' => 'premium-action-btn--default',
    'download' => 'premium-action-btn--success',
];
$btnClass = 'premium-action-btn premium-action-btn--' . $size . ' ' . ($variantMap[$variant] ?? 'premium-action-btn--default');
@endphp

@if($href)
<a href="{{ $href }}" class="{{ $btnClass }}" @if($tooltip) title="{{ $tooltip }}" data-bs-toggle="tooltip" @endif @if($dataId) data-id="{{ $dataId }}" @endif {{ $attributes }}>
    @if($icon)<i class="fa {{ $icon }}"></i>@endif
    {{ $slot }}
</a>
@else
<button type="{{ $type }}" class="{{ $btnClass }}" @if($modal) data-bs-toggle="modal" data-bs-target="#{{ $modal }}" @endif @if($tooltip) title="{{ $tooltip }}" data-bs-toggle="tooltip" @endif @if($dataId) data-id="{{ $dataId }}" @endif {{ $attributes }}>
    @if($icon)<i class="fa {{ $icon }}"></i>@endif
    {{ $slot }}
</button>
@endif

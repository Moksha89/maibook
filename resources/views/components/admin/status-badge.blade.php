@props([
    'status' => 'default',
    'text' => '',
    'dot' => false,
])

@php
$statusMap = [
    'success' => 'premium-badge--success',
    'active' => 'premium-badge--success',
    'warning' => 'premium-badge--warning',
    'pending' => 'premium-badge--warning',
    'danger' => 'premium-badge--danger',
    'inactive' => 'premium-badge--danger',
    'error' => 'premium-badge--danger',
    'info' => 'premium-badge--info',
    'default' => 'premium-badge--default',
];
$badgeClass = $statusMap[$status] ?? 'premium-badge--default';
@endphp

<span class="premium-badge {{ $badgeClass }}">
    @if($dot)<span class="premium-badge__dot"></span>@endif
    {{ $text ?: $slot }}
</span>

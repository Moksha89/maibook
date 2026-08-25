@props([
    'icon' => 'fa-inbox',
    'title' => 'No data found',
    'message' => null,
    'actionText' => null,
    'actionModal' => null,
])

<div class="premium-empty-state">
    <div class="premium-empty-state__icon">
        <i class="fa {{ $icon }}"></i>
    </div>
    <h5 class="premium-empty-state__title">{{ $title }}</h5>
    @if($message)
    <p class="premium-empty-state__message">{{ $message }}</p>
    @endif
    @if($actionText && $actionModal)
    <button type="button" class="btn btn-primary premium-btn premium-empty-state__action" data-bs-toggle="modal" data-bs-target="#{{ $actionModal }}">
        {{ $actionText }}
    </button>
    @endif
    {{ $slot }}
</div>

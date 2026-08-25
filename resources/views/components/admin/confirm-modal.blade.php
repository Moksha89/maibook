@props([
    'modalId' => 'confirmModal',
    'title' => 'Confirm Action',
    'message' => 'Are you sure you want to proceed?',
    'confirmText' => 'Confirm',
    'confirmClass' => 'btn btn-danger',
    'formId' => null,
])

<div class="modal fade" id="{{ $modalId }}" tabindex="-1" aria-labelledby="{{ $modalId }}Label" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content premium-modal">
            <div class="modal-header">
                <h5 class="modal-title" id="{{ $modalId }}Label">{{ $title }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>{{ $message }}</p>
                {{ $slot }}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                @if($formId)
                <button type="submit" form="{{ $formId }}" class="{{ $confirmClass }}">{{ $confirmText }}</button>
                @else
                <button type="button" class="{{ $confirmClass }}" id="{{ $modalId }}Confirm">{{ $confirmText }}</button>
                @endif
            </div>
        </div>
    </div>
</div>

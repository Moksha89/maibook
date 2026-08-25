@extends('admin.layouts.admin')

@section('content')
<x-admin.page-header title="WhatsApp" subtitle="Connect WhatsApp to send reports">
    <a href="{{ route('admin.home') }}" class="btn btn-secondary premium-btn">
        <i class="fa fa-arrow-left"></i> Back
    </a>
</x-admin.page-header>

<div class="premium-card">
    <div class="premium-card__body">
        <div id="whatsappFeedback" class="alert d-none" role="alert"></div>
        <div class="row g-4 align-items-center">
            <div class="col-lg-6 text-center">
                <div class="border rounded p-4 bg-light">
                    <img id="whatsappQr" class="img-fluid d-none" alt="WhatsApp login QR code" style="max-width: 320px;">
                    <div id="whatsappQrPlaceholder" class="text-muted py-5">
                        QR code will appear here when login starts.
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <h5 class="mb-3">Connection status</h5>
                <p class="mb-2">State: <strong id="whatsappState">Checking…</strong></p>
                <p id="whatsappAccount" class="text-muted d-none"></p>
                <div class="d-flex flex-wrap gap-2">
                    <button type="button" id="whatsappLogin" class="btn btn-primary">
                        <i class="fa fa-sign-in"></i> Login
                    </button>
                    <button type="button" id="whatsappLogout" class="btn btn-secondary">
                        <i class="fa fa-sign-out"></i> Logout
                    </button>
                </div>
                <p class="text-muted mt-3 mb-0">Scan the QR code with WhatsApp on your phone.</p>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function () {
    const state = document.getElementById('whatsappState');
    const qr = document.getElementById('whatsappQr');
    const placeholder = document.getElementById('whatsappQrPlaceholder');
    const account = document.getElementById('whatsappAccount');
    const feedback = document.getElementById('whatsappFeedback');
    const loginButton = document.getElementById('whatsappLogin');
    const logoutButton = document.getElementById('whatsappLogout');
    let pollTimer = null;

    function showFeedback(message, type) {
        feedback.className = 'alert alert-' + type;
        feedback.textContent = message;
    }

    function startPolling() {
        if (!pollTimer) {
            pollTimer = window.setInterval(loadStatus, 3000);
        }
    }

    function stopPolling() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    function renderStatus(data) {
        state.textContent = data.state || 'disconnected';
        if (data.qr) {
            qr.src = data.qr;
            qr.classList.remove('d-none');
            placeholder.classList.add('d-none');
        } else {
            qr.removeAttribute('src');
            qr.classList.add('d-none');
            placeholder.classList.remove('d-none');
        }

        if (data.state === 'ready' && data.pushname) {
            account.textContent = 'Connected account: ' + data.pushname;
            account.classList.remove('d-none');
        } else {
            account.textContent = '';
            account.classList.add('d-none');
        }

        if (data.state === 'qr' || data.state === 'authenticated') {
            startPolling();
        } else if (data.state === 'ready' || data.state === 'disconnected') {
            stopPolling();
        }
    }

    async function request(url, options) {
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (!csrfMeta || !csrfMeta.content) {
            throw new Error('Unable to use WhatsApp controls right now.');
        }

        const response = await fetch(url, Object.assign({
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfMeta.content
            }
        }, options || {}));
        const data = await response.json().catch(function () { return {}; });
        if (!response.ok) {
            throw new Error(data.message || 'WhatsApp is unavailable right now.');
        }
        return data;
    }

    async function loadStatus() {
        try {
            renderStatus(await request('{{ route('whatsapp.status') }}', { method: 'GET' }));
        } catch (error) {
            renderStatus({ state: 'disconnected', qr: null, pushname: null });
            showFeedback(error.message, 'warning');
        }
    }

    loginButton.addEventListener('click', async function () {
        loginButton.disabled = true;
        try {
            renderStatus(await request('{{ route('whatsapp.login') }}', { method: 'POST' }));
            startPolling();
            feedback.className = 'alert d-none';
        } catch (error) {
            showFeedback(error.message, 'danger');
        } finally {
            loginButton.disabled = false;
        }
    });

    logoutButton.addEventListener('click', async function () {
        stopPolling();
        logoutButton.disabled = true;
        try {
            renderStatus(await request('{{ route('whatsapp.logout') }}', { method: 'POST' }));
            feedback.className = 'alert d-none';
        } catch (error) {
            showFeedback(error.message, 'danger');
        } finally {
            logoutButton.disabled = false;
        }
    });

    loadStatus();
});
</script>
@endsection

@extends('admin.layouts.admin')
@section('content')

<x-admin.page-header title="Backups" subtitle="Manage database backups">
    <button type="button" class="btn btn-primary premium-btn" data-bs-toggle="modal" data-bs-target="#NewbackupModal">
        <i class="fa fa-cloud-upload"></i> New Backup
    </button>
</x-admin.page-header>

<div class="premium-card">
    <div class="premium-card__body">
        <x-admin.filter-bar table-id="example" :show-export="true" />

        <div id="backupsSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="3" />
        </div>

        <div id="backupsEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-cloud-upload" title="No backups found" message="Create your first backup to protect your data." action-text="New Backup" action-modal="NewbackupModal" />
        </div>

        <button type="button" id="open_verify" data-bs-toggle="modal" data-bs-target="#verifyModal" style="display:none;"></button>
        <button type="button" id="open_restore" data-bs-toggle="modal" data-bs-target="#exampleModal2" style="display:none;"></button>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="example" class="table table-striped" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Data</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- OTP Modal -->
<div class="modal fade" id="otpModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content premium-modal">
            <div class="modal-header">
                <h5 class="modal-title" id="otpModalLabel">OTP Verification Method</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Please choose where to send the OTP:</p>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="otpMethod" id="otpEmail" value="email">
                    <label class="form-check-label" for="otpEmail" id="otpEmailLabel">
                        Email Address: <span id="otpEmailText">{{Auth::user()->email}}</span>
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="otpMethod" id="otpSMS" value="sms">
                    <label class="form-check-label" for="otpSMS" id="otpSMSText">
                        SMS: <span id="otpPhoneText">{{Auth::user()->phone}}</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="otp_close" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="otpContinue">Continue</button>
            </div>
        </div>
    </div>
</div>

<!-- Verify OTP Modal -->
<div class="modal fade" id="verifyModal" tabindex="-1" aria-labelledby="verifyModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content premium-modal">
            <div class="modal-header">
                <h5 class="modal-title" id="verifyModalLabel">Verify Your OTP</h5>
                <button type="button" class="btn-close" id="verify_close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="verifyOtpForm">
                @csrf
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="otpInput" class="form-label">Enter OTP:</label>
                        <input type="text" id="otpInput" class="form-control" placeholder="Enter your OTP" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary verify-btn">Verify OTP</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Restore Modal -->
<x-admin.edit-modal modal-id="exampleModal2" title="">
    <form id="restore_backup">
        <div class="modal-body">
            <h1 class="modal-title fs-5 mm-txt-back">Restore a previous backup will overwrite current record. Continue?</h1>
            <input type="hidden" name="id" id="restore_id">
        </div>
        <div class="modal-footer inactive-mod-footer restore-btn-mm">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Restore</button>
        </div>
    </form>
</x-admin.edit-modal>

<!-- New Backup Modal -->
<x-admin.edit-modal modal-id="NewbackupModal" title="">
    <form id="initiate_backup">
        <div class="modal-body modal-company-body">
            <h5>Are you sure you want to backup the entire records?</h5>
        </div>
        <div class="modal-footer add-company-footer">
            <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary Create-btn">Backup</button>
        </div>
    </form>
</x-admin.edit-modal>

@endsection

@section('scripts')
@parent

<script type="text/javascript">
    function putrestore(id) {
        document.getElementById('restore_id').value = id;
    }

    var backupTable = initRealtimeTable('example', '/api/backups', [
        { data: 'sn' },
        { data: 'data' },
        {
            data: 'id',
            orderable: false,
            searchable: false,
            render: function(data) {
                return '<a href="/backup/download/' + data + '" class="premium-action-btn premium-action-btn--sm premium-action-btn--success" title="Download"><i class="fa fa-download"></i></a> ' +
                       '<button type="button" class="premium-action-btn premium-action-btn--sm premium-action-btn--warning" title="Restore" onclick="putrestore(\'' + data + '\')" data-id="' + data + '" data-bs-toggle="modal" data-bs-target="#otpModal"><i class="fa fa-clock-o"></i></button>';
            }
        }
    ]);

    // Hide skeleton + show empty state
    $('#example').on('init.dt', function() { $('#backupsSkeleton').hide(); });
    $('#example').on('xhr.dt', function(e, settings, json) {
        $('#backupsSkeleton').hide();
        if (json && json.data && json.data.length === 0) { $('#backupsEmpty').show(); } else { $('#backupsEmpty').hide(); }
    });

    $('#verifyOtpForm').on('submit', function(event) {
        event.preventDefault();
        $.ajax({
            url: "{{ route('verifyOtp2') }}",
            method: "POST",
            data: { _token: '{{ csrf_token() }}', otp: $('#otpInput').val() },
            success: function(response) {
                if(response.success) {
                    Swal.fire("Success", "OTP verified successfully!", "success");
                    $('#verify_close').click();
                    $('#open_restore').click();
                } else {
                    Swal.fire("Error", response.message || "Failed to verify OTP.", "error");
                }
            },
            error: function(xhr) {
                Swal.fire("Error", "An error occurred. Please try again.", "error");
            }
        });
    });

    $('#initiate_backup').on('submit', function(e) {
        e.preventDefault();
        const userId = @json(Auth::user()->user_id);
        $.ajax({
            url: '{{ route("backup") }}',
            method: 'GET',
            headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            data: { user_id: userId },
            success: function(data) {
                if (data.success) {
                    Swal.fire({ icon: 'success', title: 'Success!', text: 'Backup created successfully!' }).then(function() { location.reload(); });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create backup: ' + data.error });
                }
            },
            error: function(xhr, status, error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred: ' + error });
            }
        });
    });
</script>

@endsection

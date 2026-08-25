@extends('admin.layouts.admin')
@section('content')
<link rel="stylesheet" href="{{ asset('assets_admin/css/view-employee.css') }}">
<link rel="stylesheet" href="{{ asset('assets_admin/css/requests.css') }}">

<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.21/css/jquery.dataTables.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">


<div class="row">
    <div class="col-sm-12 col-12">
        <div class="card">
            <div class="card-body">
                <div class="card-title btns-back-edit">
                    <h5 class="emp-del-title">Backup</h5>
                     <button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#NewbackupModal">
            <i class="fa fa-cloud-upload"></i> New Backup
        </button>
                </div>



<button type="button" id="open_verify" data-bs-toggle="modal" data-bs-target="#verifyModal" style="display:none;"></button>
<button type="button" id="open_restore" data-bs-toggle="modal" data-bs-target="#exampleModal2" style="display:none;"></button>

                <div class="custom-tabs-container request-tab-all">
                    <div class="table-responsive">
                        

<table id="example" class="table table-striped app-responsive-table" style="width:100%">
    <thead>
        <tr>
            <th>S/N</th>
            <th>Data</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        @php $sn = 1; @endphp
        @foreach($Backup as $backups)
        <tr>
            <td>{{ $sn }}</td>
            <td>{{ \Carbon\Carbon::createFromTimestamp($backups->timestamp)->format('Y-m-d H:i:s') }}</td>
            <td class="btn-action btn_color_change">
                <!-- Download Button -->
                <a href="{{ route('backup.download', $backups->id) }}" class="btn btn-primary cross">
                    <i class="fa fa-download"></i>
                </a>

                <!-- Restore Button -->
                <button type="button" class="btn btn-primary gear" onclick="putrestore('{{ $backups->id }}')" data-id="{{ $backups->id }}" data-bs-toggle="modal" data-bs-target="#otpModal">
                    <i class="fa fa-clock-o"></i>
                </button>
            </td>
        </tr>
        @php $sn++; @endphp
        @endforeach
    </tbody>
</table>



                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- OTP Modal -->
<div class="modal fade" id="otpModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
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


<div class="modal fade" id="verifyModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="otpModalLabel">Verify Your OTP</h5>
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


<!-- Modal inactive -->
                <div class="modal fade inactive-mod" id="exampleModal2" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                      <div class="modal-content">
                        <!-- <div class="modal-header">
                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div> -->

                        <form id="restore_backup">
                        <div class="modal-body">
                            <h1 class="modal-title fs-5 mm-txt-back" id="exampleModalLabel">Restore a previous backup will overwrite current record.Continue?</h1>

<input type="hidden" name="id" id="restore_id">
                        </div>

                        <div class="modal-footer inactive-mod-footer restore-btn-mm">
                          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                          <button type="submit" class="btn btn-primary">Restore</button>
                        </div>

                        </form>
                      </div>
                    </div>
                  </div>
                  <!--  -->



                                  <!-- modal-strt NEw-backup -->
<div class="modal fade new-backup-mod" id="NewbackupModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header">
        </div>

        <form id="initiate_backup">
        <div class="modal-body modal-company-body">
            <h5>Are you sure you want to backup the entire records?</h5>
        </div>
        <div class="modal-footer add-company-footer">
            <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary Create-btn">Backup</button>
        </div>

        </form>
      </div>
    </div>
  </div>
                <!-- modal-strt New backup -->







@endsection

@section('scripts')
@parent

<script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.js"></script>
<script type="text/javascript" src="https://cdn.datatables.net/1.10.21/js/jquery.dataTables.js"></script>


<script type="text/javascript">
    $(document).ready(function() {
        $('#example').DataTable();
    });

    function putrestore(id) {
        document.getElementById('restore_id').value = id;
    }
</script>



<script>
$(document).ready(function() {




    $('#verifyOtpForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        $.ajax({
            url: "{{ route('verifyOtp2') }}", // Update with your route
            method: "POST",
            data: {
                _token: '{{ csrf_token() }}',
                otp: $('#otpInput').val()
            },
            success: function(response) {
                if(response.success) {
                    Swal.fire("Success", "OTP verified successfully!", "success");
                    // Optionally, perform further actions (e.g., close modal, redirect)

$('#verify_close').click();
$('#open_restore').click();

                } else {
                    Swal.fire("Error", response.message || "Failed to verify OTP.", "error");
                }
            },
            error: function(xhr) {
                Swal.fire("Error", "An error occurred. Please try again.", "error");
                console.log(xhr.responseText);
            }
        });
    });
});
</script>



<script>
    $('#initiate_backup').on('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        // Retrieve the user ID from Laravel's Auth
        const userId = @json(Auth::user()->user_id);

        // Send an AJAX request to the backup route
        $.ajax({
            url: '{{ route("backup") }}',
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            data: { user_id: userId },
            success: function(data) {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Backup created successfully!'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to create backup: ' + data.error
                    });
                }
            },
            error: function(xhr, status, error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred: ' + error
                });
                console.error('Error:', error);
            }
        });
    });






</script>



@endsection
@extends('admin.layouts.admin')

@section('content')

<link rel="stylesheet" href="{{ asset('assets_admin/css/view-employee.css') }}">
<link rel="stylesheet" href="{{ asset('assets_admin/css/requests.css') }}">
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.21/css/jquery.dataTables.css">

<style>
  .add_email_save {
    background: #ffcf0f;
    border: 1px solid #ffcf0f;
    padding: 0.5rem 2.25rem;
}
  .add_email_save:hover {
    background: #ffcf0f !important;
    border: 1px solid #ffcf0f !important;
}
.back_to_email {
    background: #FFC107 !important;
    border: 1px solid #FFC107 !important;
    font-size: 16px;
    font-weight: 600;
}
@media(min-width: 240px) and (max-width: 479px){
    .back_to_email {
    font-size: 12px !important;
}
}
@media(min-width: 280px) and (max-width: 319px){
    .card-title.btns-back-edit {
    display: grid !important;
    gap: 10px !important;
}
}
</style>
<div class="row">
    <div class="col-sm-12 col-12">
        <div class="card">
            <div class="card-body">
                <div class="card-title btns-back-edit d-flex justify-content-between align-items-center">
                    <h5 class="emp-del-title">Add New Email</h5>
                    <a href="{{ route('backup-emails.index') }}" class="btn btn-secondary back_to_email">Back to Emails</a>
                </div>

                <!-- Form to Add New Email -->
                <form action="{{ route('backup-emails.store') }}" method="POST" class="mt-4">
                    @csrf
                    <div class="form-group">
                        <label for="email" class="form-label">Email Address:</label>
                        <input type="email" name="email" id="email" class="form-control" placeholder="Enter email address" required>
                    </div>

                    <button type="submit" class="btn btn-primary mt-3 add_email_save">Save</button>
                </form>

            </div>
        </div>
    </div>
</div>

@endsection

@extends('admin.layouts.admin')

@section('content')

<style>
.back_to_email {
    background: #FFC107 !important;
    border: 1px solid #FFC107 !important;
    font-size: 16px;
    font-weight: 600;
}
.add_email_save {
    background: #ffcf0f;
    border: 1px solid #ffcf0f;
    padding: 0.5rem 2.25rem;
}
  .add_email_save:hover {
    background: #ffcf0f !important;
    border: 1px solid #ffcf0f !important;
}
.btns-back-edit h2.emp-del-title {
    font-size: 1.2rem;
    margin: 0px !important;
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
                    <h2 class="emp-del-title">Edit Email</h2>
                    <a href="{{ route('backup-emails.index') }}" class="btn btn-secondary back_to_email">Back to Emails</a>
                </div>

                <!-- Edit Email Form -->
                <form action="{{ route('backup-emails.update', $backupEmail->id) }}" method="POST" class="mt-4">
                    @csrf
                    @method('PUT')
                    
                    <div class="form-group">
                        <label for="email" class="form-label">Email Address:</label>
                        <input type="email" name="email" id="email" value="{{ $backupEmail->email }}" class="form-control" placeholder="Enter email address" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary mt-3 add_email_save">Update</button>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection

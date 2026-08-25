@extends('admin.layouts.admin')
@section('content')

<link rel="stylesheet" href="{{ asset('assets_admin/css/view-employee.css') }}">
<link rel="stylesheet" href="{{ asset('assets_admin/css/requests.css') }}">
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.21/css/jquery.dataTables.css">

<style>
    .btns-back-edit a.btn.btn-primary {
    background: #FFC107;
    border: #FFC107;
    font-size: 16px;
    font-weight: 600;
}
.table-striped a.btn.btn-sm.btn-warning {
    padding: 6px 7px !important;
    background: #FFC107;
    border: #FFC107;
    border-radius: 4px;
    line-height: 0px;
}
.table-striped .btn-warning i.fa.fa-edit {
    font-size: 14px;
    color: #000;
    line-height: normal;
    margin: 0px;
}
.table-striped .btn-danger i.fa.fa-trash {
    color: #fff !important;
    font-size: 14px;
    margin: 0px;
    line-height: 0px !important;
}
.table-striped .btn.btn-sm.btn-danger {
    padding: 4px 8px !important;
    background: #dc3545;
    border-radius: 4px;
    line-height: normal;
}
@media(min-width: 240px) and (max-width: 479px){
    .btns-back-edit a.btn.btn-primary {
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
                    <h5 class="emp-del-title">Backup Emails</h5>
                    <a href="{{ route('backup-emails.create') }}" class="btn btn-primary">Add New Email</a>
                </div>

                <div class="custom-tabs-container request-tab-all">
                    <div class="table-responsive">
                        <table id="all_transactions" class="table table-striped app-responsive-table" style="width:100%">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Date/Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($emails as $email)
                                    <tr>
                                        <td>{{ $email->id }}</td>
                                        <td>{{ $email->email }}</td>
                                        <td>{{ $email->date_time }}</td>
                                        <td>
                                            <a href="{{ route('backup-emails.edit', $email->id) }}" class="btn btn-sm btn-warning"><i class="fa fa-edit" style="cursor: pointer;"></i></a>
                                            <form action="{{ route('backup-emails.destroy', $email->id) }}" method="POST" style="display:inline;">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this email?')"><i class="fa fa-trash" style="cursor: pointer; color: red;"></i></button>
                                            </form>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
@parent
<script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.js"></script>
<script type="text/javascript" src="https://cdn.datatables.net/1.10.21/js/jquery.dataTables.js"></script>

<script type="text/javascript">
    $(document).ready(function() {
        $('#all_transactions').DataTable({
            "order": [[2, "asc"]] // Sort by ID in descending order by default
        });
    });
</script>
@endsection

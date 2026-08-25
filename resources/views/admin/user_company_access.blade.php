@extends('admin.layouts.admin')
@section('content')

<x-admin.page-header title="User Company Access" subtitle="Manage user access to companies" />

<div class="premium-card">
    <div class="premium-card__body">
        <x-admin.filter-bar table-id="user_company_access_tbl" :show-export="true" />

        <div id="ucaSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="5" />
        </div>

        <div id="ucaEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-universal-access" title="No user company access records" message="Access records will appear here once users are granted company access." />
        </div>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="user_company_access_tbl" class="table table-striped app-responsive-table" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>User Name</th>
                            <th>Company Name</th>
                            <th>Access</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<x-admin.edit-modal modal-id="editModal" title="Edit Company Assignment">
    <form action="#" method="POST">
        @csrf
        <div class="form-group">
            <label for="user_id">User ID:</label>
            <select class="form-select" name="user_id" id="user_id">
                <option value="">Select</option>
                @foreach($all_users as $partners)
                    <option value="{{ $partners->id }}">{{ $partners->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label for="company_id">Company ID:</label>
            <select class="form-select" name="company_id" id="company_id">
                <option value="">Select</option>
                @foreach($all_campanies as $campanies)
                    <option value="{{ $campanies->id }}">{{ $campanies->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label for="access_level">Access:</label>
            <select class="form-select" name="access_level" id="access_level" required>
                <option value="">Select</option>
                <option value="full">Full Access</option>
                <option value="read">Readonly Access</option>
            </select>
        </div>
        <button type="submit" class="btn btn-primary">Update</button>
    </form>
</x-admin.edit-modal>

<x-admin.delete-modal modal-id="deleteModal" title="Confirm Delete" message="Are you sure you want to delete this assignment?" />

@endsection

@section('scripts')
@parent

<script type="text/javascript">
    var ucaTable = initRealtimeTable('user_company_access_tbl', '/api/user-company-access', [
        { data: 'sn' },
        { data: 'user_name' },
        { data: 'company_name' },
        {
            data: 'access_level',
            render: function(data) {
                if (data === 'full') {
                    return '<span class="premium-badge premium-badge--success"><span class="premium-badge__dot"></span> Full Access</span>';
                }
                return '<span class="premium-badge premium-badge--info"><span class="premium-badge__dot"></span> Read Only</span>';
            }
        },
        {
            data: null,
            orderable: false,
            searchable: false,
            render: function(data, type, row) {
                return '<button type="button" class="premium-action-btn premium-action-btn--sm premium-action-btn--primary edit-button" title="Edit" data-id="' + row.id + '"><i class="fa fa-edit"></i></button> ' +
                       '<button type="button" class="premium-action-btn premium-action-btn--sm premium-action-btn--danger delete-button" title="Delete" data-id="' + row.id + '"><i class="fa fa-trash"></i></button>';
            }
        }
    ]);

    // Hide skeleton + show empty state
    $('#user_company_access_tbl').on('init.dt', function() { $('#ucaSkeleton').hide(); });
    $('#user_company_access_tbl').on('xhr.dt', function(e, settings, json) {
        $('#ucaSkeleton').hide();
        if (json && json.data && json.data.length === 0) { $('#ucaEmpty').show(); } else { $('#ucaEmpty').hide(); }
    });

    $(document).on('click', '.edit-button', function() {
        var id = $(this).data('id');
        $.get('user_company_access/' + id + '/edit', function(data) {
            $('#editModal #user_id').val(data.user_id).attr('disabled', true);
            $('#editModal #company_id').val(data.company_id).attr('disabled', true);
            $('#editModal #access_level').val(data.access_level);
            $('#editModal form').attr('action', 'user_company_access/' + id);
            $('#editModal').modal('show');
        });
    });

    $(document).on('click', '.delete-button', function() {
        var id = $(this).data('id');
        $('#deleteModal form').attr('action', 'user_company_access/' + id);
        $('#deleteModal').modal('show');
    });
</script>

@endsection

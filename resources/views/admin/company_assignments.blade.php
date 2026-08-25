@extends('admin.layouts.admin')
@section('content')

<x-admin.page-header title="Company Assignments" subtitle="Manage partner-company assignments" />

<div class="premium-card">
    <div class="premium-card__body">
        <x-admin.filter-bar table-id="company_assignments" :show-export="true" />

        <div id="assignmentsSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="5" />
        </div>

        <div id="assignmentsEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-tasks" title="No company assignments found" message="Assignments will appear here once partners are assigned to companies." />
        </div>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="company_assignments" class="table table-striped" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Partner Name</th>
                            <th>Company Name</th>
                            <th>Created At</th>
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
            <label for="partner_id">Partner ID:</label>
            <select class="form-select" name="partner_id" id="partner_id">
                <option value="">Select</option>
                @foreach($all_partners as $partners)
                    <option value="{{ $partners->uuid }}">{{ $partners->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label for="company_id">Company ID:</label>
            <select class="form-select" name="company_id" id="company_id">
                <option value="">Select</option>
                @foreach($all_campanies as $campanies)
                    <option value="{{ $campanies->company_id }}">{{ $campanies->name }}</option>
                @endforeach
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
    var assignmentsTable = initRealtimeTable('company_assignments', '/api/company-assignments', [
        { data: 'sn' },
        { data: 'partner_name' },
        { data: 'company_name' },
        { data: 'created_at' },
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
    $('#company_assignments').on('init.dt', function() { $('#assignmentsSkeleton').hide(); });
    $('#company_assignments').on('xhr.dt', function(e, settings, json) {
        $('#assignmentsSkeleton').hide();
        if (json && json.data && json.data.length === 0) { $('#assignmentsEmpty').show(); } else { $('#assignmentsEmpty').hide(); }
    });

    $(document).on('click', '.edit-button', function() {
        var id = $(this).data('id');
        $.get('company_assignments/' + id + '/edit', function(data) {
            $('#editModal #partner_id').val(data.partner_id).attr('disabled', true);
            $('#editModal #company_id').val(data.company_id);
            $('#editModal #timestamp').val(new Date(data.timestamp * 1000).toLocaleString());
            $('#editModal form').attr('action', 'company_assignments/' + id);
            $('#editModal').modal('show');
        });
    });

    $(document).on('click', '.delete-button', function() {
        var id = $(this).data('id');
        $('#deleteModal form').attr('action', 'company_assignments/' + id);
        $('#deleteModal').modal('show');
    });
</script>

@endsection

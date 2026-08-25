@extends('admin.layouts.admin')
@section('content')

<x-admin.page-header title="All Companies" subtitle="Manage company accounts">
    <button type="button" class="btn btn-primary premium-btn" data-bs-toggle="modal" data-bs-target="#exampleModal">
        <i class="fa fa-plus"></i> New Company
    </button>
</x-admin.page-header>

<div class="premium-card">
    <div class="premium-card__body">
        <x-admin.filter-bar table-id="all_comapny" :show-export="true" :show-status-filter="true" />

        <div id="companiesSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="5" />
        </div>

        <div id="companiesEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-building" title="No companies found" message="Create your first company to get started." action-text="New Company" action-modal="exampleModal" />
        </div>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="all_comapny" class="table table-striped" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Name</th>
                            <th>Still Active</th>
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

<!-- Create Company Modal -->
<x-admin.edit-modal modal-id="exampleModal" title="Create New Company">
    <form method="POST" id="create_company_form" action="{{ route('create-company') }}">
        @csrf
        <div class="modal-body modal-company-body">
            <div class="login-div">
                <div class="form-group">
                    <input type="text" name="name" class="form-control" id="companyNameInput" placeholder="" required>
                    <label class="floating-label" for="companyNameInput"><i class='fas fa-city'></i> Enter New Company</label>
                </div>
            </div>
        </div>
        <div class="modal-footer add-company-footer">
            <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Close</button>
            <button type="submit" class="btn btn-primary Create-btn" id="submitCompanyBtn">Save changes</button>
        </div>
    </form>
</x-admin.edit-modal>

<!-- Edit Company Modal -->
<x-admin.edit-modal modal-id="editModal" title="Company Settings">
    <form method="post" id="edit_company_form">
        @csrf
        <div class="modal-body modal-company-body">
            <div class="login-div setting-div">
                <input type="hidden" name="id" id="editid" class="form-control">
                <div class="form-group">
                    <input type="text" class="form-control" name="name" id="editname" placeholder="">
                    <label class="floating-label" for="editname"><i class='fas fa-city'></i> Edit Company Name</label>
                </div>
            </div>
        </div>
        <div class="modal-footer add-company-footer">
            <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Close</button>
            <button type="submit" class="btn btn-primary Create-btn" id="submitCompanyBtn">Save changes</button>
        </div>
    </form>
</x-admin.edit-modal>

@endsection

@section('scripts')
@parent

<script type="text/javascript">
    var companiesTable = initRealtimeTable('all_comapny', '/api/companies', [
        { data: 'sn' },
        { data: 'name' },
        {
            data: 'still_active',
            render: function(data) {
                if (data === 'Active') {
                    return '<span class="premium-badge premium-badge--success"><span class="premium-badge__dot"></span> Active</span>';
                }
                return '<span class="premium-badge premium-badge--danger"><span class="premium-badge__dot"></span> Inactive</span>';
            }
        },
        { data: 'created_at' },
        {
            data: null,
            orderable: false,
            searchable: false,
            render: function(data, type, row) {
                var escapedName = row.name.replace(/'/g, "\\'");
                var html = '<a class="premium-action-btn premium-action-btn--sm premium-action-btn--primary" title="Edit" data-bs-toggle="modal" data-bs-target="#editModal" onclick="openEditModal(' + row.id + ', \'' + escapedName + '\')" ><i class="fa fa-edit"></i></a> ';
                html += '<a href="#" class="premium-action-btn premium-action-btn--sm premium-action-btn--danger delete-icon" title="Delete" data-id="' + row.id + '"><i class="fa fa-trash"></i></a> ';
                if (row.still_active_raw == 1) {
                    html += '<a class="premium-action-btn premium-action-btn--sm premium-action-btn--warning make-inactive" title="Make Inactive" data-id="' + row.id + '"><i class="fa fa-times-circle"></i></a>';
                } else {
                    html += '<a class="premium-action-btn premium-action-btn--sm premium-action-btn--success make-active" title="Make Active" onclick="Activeme(\'' + row.id + '\')" data-id="' + row.id + '"><i class="fa fa-check-circle"></i></a>';
                }
                return html;
            }
        }
    ]);

    // Hide skeleton + show empty state
    $('#all_comapny').on('init.dt', function() { $('#companiesSkeleton').hide(); });
    $('#all_comapny').on('xhr.dt', function(e, settings, json) {
        $('#companiesSkeleton').hide();
        if (json && json.data && json.data.length === 0) { $('#companiesEmpty').show(); } else { $('#companiesEmpty').hide(); }
    });

    // Status filter
    $('#all_comapnyStatusFilter').on('change', function() {
        companiesTable.column(2).search(this.value).draw();
    });

    function openEditModal(id, name) {
        $('#editid').val(id);
        $('#editname').val(name);
        $('#editModal').modal('show');
    }

    $(document).on('click', '.edit-company', function() {
        var companyId = $(this).data('id');
        var companyName = $(this).data('name');
        $("#editid").val(companyId);
        $("#editname").val(companyName);
    });

    $(document).on('click', '.make-active', function() {
        var companyId = $(this).data('id');
        makeActive(companyId);
    });

    $(document).on('click', '.make-inactive', function() {
        var companyId = $(this).data('id');
        makeInactive(companyId);
    });

    function makeActive(companyId) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will make the company active.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, make active'
        }).then(function(result) {
            if (result.isConfirmed) {
                $.ajax({
                    url: "{{ route('make-active', ':id') }}".replace(':id', companyId),
                    type: 'PATCH',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(response) {
                        Swal.fire('Success', 'Company marked as active successfully!', 'success');
                        location.reload();
                    },
                    error: function(xhr) {
                        Swal.fire('Error', 'An error occurred while making the company active.', 'error');
                    }
                });
            }
        });
    }

    function makeInactive(companyId) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will make the company inactive.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, make inactive'
        }).then(function(result) {
            if (result.isConfirmed) {
                $.ajax({
                    url: "{{ route('make-inactive', ':id') }}".replace(':id', companyId),
                    type: 'PATCH',
                    data: { _token: '{{ csrf_token() }}' },
                    success: function(response) {
                        Swal.fire('Success', 'Company marked as inactive successfully!', 'success');
                        location.reload();
                    },
                    error: function(xhr) {
                        Swal.fire('Error', 'An error occurred while making the company inactive.', 'error');
                    }
                });
            }
        });
    }

    $('#create_company_form').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            url: "{{ route('create-company') }}",
            type: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                Swal.fire({ title: 'Success', text: response.success, icon: 'success', timer: 2000, showConfirmButton: false }).then(function() { location.reload(); });
            },
            error: function(xhr) {
                Swal.fire('Error', xhr.responseJSON?.message || 'Failed to create company', 'error');
            }
        });
    });

    $('#edit_company_form').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            url: "{{ route('edit-company') }}",
            type: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                $('#edit_company_form')[0].reset();
                $('#editModal').modal('hide');
                Swal.fire({ title: 'Success', text: response.success, icon: 'success', timer: 2000, showConfirmButton: false }).then(function() { location.reload(); });
            },
            error: function(xhr) {
                Swal.fire('Error', xhr.responseJSON?.message || 'Failed to update company', 'error');
            }
        });
    });

    $(document).on('click', '.delete-icon', function(e) {
        e.preventDefault();
        var companyId = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(function(result) {
            if (result.isConfirmed) {
                $.ajax({
                    url: "{{ route('delete_company', '') }}/" + companyId,
                    type: 'DELETE',
                    headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                    success: function(response) {
                        Swal.fire('Deleted!', response.success, 'success').then(function() { location.reload(); });
                    },
                    error: function(xhr) {
                        Swal.fire('Error', xhr.responseJSON?.message || 'Failed to delete company', 'error');
                    }
                });
            }
        });
    });
</script>

@endsection

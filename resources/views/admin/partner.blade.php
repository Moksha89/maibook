@extends('admin.layouts.admin')
@section('content')

<x-admin.page-header title="All Partners" subtitle="Manage partner accounts">
    <button type="button" class="btn btn-primary premium-btn" data-bs-toggle="modal" data-bs-target="#exampleModal">
        <i class="fa fa-user-plus"></i> New Partner
    </button>
</x-admin.page-header>

<div class="premium-card">
    <div class="premium-card__body">
        <!-- Filter Bar -->
        <x-admin.filter-bar table-id="partners" :show-export="true" :show-status-filter="true" />

        <!-- Skeleton Loader -->
        <div id="partnersSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="6" />
        </div>

        <!-- Empty State (shown via JS when no data) -->
        <div id="partnersEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-handshake-o" title="No partners found" message="Create your first partner to get started." action-text="New Partner" action-modal="exampleModal" />
        </div>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="partners" class="table table-striped app-responsive-table" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Name</th>
                            <th>Company Name</th>
                            <th>Balance</th>
                            <th>Still Active</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Create Partner Modal -->
<x-admin.edit-modal modal-id="exampleModal" title="Create New Partner">
    <form id="create_partner">
        @csrf
        <div class="modal-body modal-company-body">
            <div class="login-div">
                <div class="form-group">
                    <label class="floating-label" for="partner_name"><i class='fas fa-user-alt'></i>Enter User Name</label>
                    <input type="text" class="form-control" id="partner_name" name="partner_name" placeholder="">
                    <div class="text-danger" id="partner_name_error"></div>
                </div>
            </div>
            <div class="login-div mix-from">
                <div class="form-group">
                    <label class="floating-label" for="company_name"><i class='fas fa-city'></i>Select Company</label>
                    <select class="form-control" name="company_id">
                        <option value="">Select Company</option>
                        @foreach($companies as $company)
                            <option value="{{$company->company_id}}">{{$company->name}}</option>
                        @endforeach
                    </select>
                    <div class="text-danger" id="company_name_error"></div>
                </div>
            </div>
        </div>
        <div class="modal-footer add-company-footer">
            <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary Create-btn" id="createUserButton">Create User</button>
        </div>
    </form>
</x-admin.edit-modal>

<!-- Inactive Modal -->
<x-admin.edit-modal modal-id="exampleModal1" title="">
    <form id="inactive_form">
        @csrf
        <div class="modal-body">
            <h1 class="modal-title fs-5">Are you sure you want to make this user inactive</h1>
        </div>
        <div class="modal-footer inactive-mod-footer">
            <input type="hidden" name="id" id="inactive_id">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Make Inactive</button>
        </div>
    </form>
</x-admin.edit-modal>

<!-- Edit Partner Modal -->
<x-admin.edit-modal modal-id="editModal" title="Edit Partner">
    <form id="edit_partner_form">
        @csrf
        <div class="modal-body">
            <input type="hidden" name="id" id="edit_partner_id">
            <div class="form-group">
                <label for="edit_partner_name">Name</label>
                <input type="text" name="name" id="edit_partner_name" class="form-control" required>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
    </form>
</x-admin.edit-modal>

@endsection

@section('scripts')
@parent

<script type="text/javascript">
    var partnersTable = initRealtimeTable('partners', '/api/partners', [
        { data: 'sn' },
        { data: 'name' },
        { data: 'company_name' },
        { data: 'balance' },
        {
            data: 'still_active',
            render: function(data) {
                if (data === 'Active') {
                    return '<span class="premium-badge premium-badge--success"><span class="premium-badge__dot"></span> Active</span>';
                }
                return '<span class="premium-badge premium-badge--danger"><span class="premium-badge__dot"></span> Inactive</span>';
            }
        },
        {
            data: null,
            orderable: false,
            searchable: false,
            render: function(data, type, row) {
                var html = '';
                if (row.still_active_raw == 1) {
                    html += '<button class="premium-action-btn premium-action-btn--sm premium-action-btn--danger" title="Make Inactive" data-bs-toggle="modal" onclick="inactivebtn(this)" data-id="' + row.uuid + '" data-bs-target="#exampleModal1"><i class="fas fa-user-alt-slash"></i></button> ';
                } else {
                    html += '<button class="premium-action-btn premium-action-btn--sm premium-action-btn--success" title="Make Active" onclick="activebtn(this)" data-id="' + row.uuid + '"><i class="fa fa-check-circle"></i></button> ';
                }
                html += '<a type="button" class="premium-action-btn premium-action-btn--sm premium-action-btn--primary edit-icon" title="Edit" data-id="' + row.id + '" data-name="' + row.name + '" data-bs-toggle="modal" data-bs-target="#editModal"><i class="fa fa-edit"></i></a> ';
                html += '<a href="#" class="premium-action-btn premium-action-btn--sm premium-action-btn--danger delete-icon" title="Delete" data-id="' + row.id + '"><i class="fa fa-trash"></i></a>';
                return html;
            }
        }
    ]);

    // Hide skeleton on data load
    $('#partners').on('init.dt', function() {
        $('#partnersSkeleton').hide();
    });
    $('#partners').on('xhr.dt', function(e, settings, json) {
        $('#partnersSkeleton').hide();
        if (json && json.data && json.data.length === 0) {
            $('#partnersEmpty').show();
        } else {
            $('#partnersEmpty').hide();
        }
    });

    // Status filter
    $('#partnersStatusFilter').on('change', function() {
        partnersTable.column(4).search(this.value).draw();
    });

    function inactivebtn(element) {
        var id = $(element).data('id');
        $('#inactive_id').val(id);
    }

    function activebtn(element) {
        var id = $(element).data('id');
        $.ajax({
            url: "{{ route('partners.active') }}",
            type: "POST",
            data: { _token: '{{ csrf_token() }}', id: id },
            success: function(response) {
                if (response.success) {
                    Swal.fire("Success", response.success, "success");
                    location.reload();
                } else {
                    Swal.fire("Error", response.error, "error");
                }
            },
            error: function(xhr) {
                var errors = xhr.responseJSON.errors;
                if (errors) {
                    Swal.fire("Validation error", Object.values(errors).join(', '), "error");
                } else {
                    Swal.fire("Error", "Something went wrong. Please try again.", "error");
                }
            }
        });
    }

    $('#inactive_form').submit(function(e) {
        e.preventDefault();
        $.ajax({
            url: "{{ route('partners.inactive') }}",
            type: "POST",
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    Swal.fire("Success", response.success, "success");
                    $('#exampleModal1').modal('hide');
                    location.reload();
                } else {
                    Swal.fire("Error", response.error, "error");
                }
            },
            error: function(xhr) {
                var errors = xhr.responseJSON.errors;
                if (errors) {
                    Swal.fire("Validation error", Object.values(errors).join(', '), "error");
                } else {
                    Swal.fire("Error", "Something went wrong. Please try again.", "error");
                }
            }
        });
    });

    $('#edit_partner_form').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            url: "{{ route('update-partner') }}",
            type: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                $('#editModal').modal('hide');
                Swal.fire({ title: 'Success', text: response.success, icon: 'success', timer: 2000, showConfirmButton: false }).then(function() { location.reload(); });
            },
            error: function(xhr) {
                Swal.fire('Error', xhr.responseJSON?.message || 'Failed to update name', 'error');
            }
        });
    });

    $(document).on('click', '.edit-icon', function() {
        var partnerId = $(this).data('id');
        var partnerName = $(this).data('name');
        $('#edit_partner_id').val(partnerId);
        $('#edit_partner_name').val(partnerName);
        $('#editModal').modal('show');
    });

    $(document).on('click', '.delete-icon', function(e) {
        e.preventDefault();
        var partnerId = $(this).data('id');
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
                    url: "{{ route('delete-partner') }}",
                    type: 'POST',
                    data: { _token: "{{ csrf_token() }}", id: partnerId },
                    success: function(response) {
                        Swal.fire({ title: 'Deleted!', text: response.success, icon: 'success', timer: 2000, showConfirmButton: false }).then(function() { location.reload(); });
                    },
                    error: function(xhr) {
                        Swal.fire('Error', xhr.responseJSON?.message || 'Failed to delete partner', 'error');
                    }
                });
            }
        });
    });

    $('#create_partner').on('submit', function(e) {
        e.preventDefault();
        $('#partner_name_error').text('');
        $('#company_name_error').text('');
        $.ajax({
            url: '{{route("partners.store")}}',
            type: 'POST',
            data: $(this).serialize(),
            beforeSend: function() {
                $('#createUserButton').prop('disabled', true).text('Creating...');
            },
            success: function(response) {
                if (response.success) {
                    Swal.fire("Success", response.success, "success");
                    $('#create_partner')[0].reset();
                    $('#createUserButton').prop('disabled', false).text('Create User');
                    $('.modal').modal('hide');
                    location.reload();
                }
            },
            error: function(xhr) {
                $('#createUserButton').prop('disabled', false).text('Create User');
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    if (errors.partner_name) { $('#partner_name_error').text(errors.partner_name[0]); }
                    if (errors.company_id) { $('#company_name_error').text(errors.company_id[0]); }
                } else {
                    Swal.fire("Error", xhr.responseJSON.error || 'An error occurred. Please try again.', "error");
                }
            }
        });
    });
</script>

@endsection

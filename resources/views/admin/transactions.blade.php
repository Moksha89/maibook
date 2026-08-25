@extends('admin.layouts.admin')
@section('content')

<style type="text/css">
button.btn.btn-danger.btn-sm.delete_parmanent-button {
    padding: 6px 6px 6px 8px !important;
    background: #bb2124 !important;
    border: #bb2124 !important;
    line-height: 0px !important;
}
.icon-stack {
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
}
.icon-stack .fa-trash-can {
    position: absolute;
    left: 0;
    top: 0;
    font-size: 14px;
    line-height: normal;
    margin: 0px !important;
}
.icon-stack .fa-xmark {
    position: absolute;
    left: 2px;
    top: 0;
    color: red;
    font-size: 14px;
    margin: 0px !important;
}
button.btn.btn-primary.btn-sm.edit-button {
    border: #ffc107;
    padding: 6px 10px !important;
    background: #ffc107;
    line-height: 0 !important;
}
.edit-button i.fas.fa-pen {
    font-size: 14px;
    line-height: normal !important;
    margin: 0px !important;
    color: #000;
}
.delete-button i.fa.fa-trash-can {
    font-size: 14px;
    line-height: normal !important;
    margin: 0px !important;
    color: #FFF;
}
button.btn.btn-danger.btn-sm.delete-button {
    background: #dc3545;
    padding: 6px 10px !important;
    line-height: 0px !important;
}
button.btn.btn-danger.btn-sm.restore-button {
    background: #008000;
    padding: 6px 10px !important;
    line-height: 0px !important;
    border: #008000;
}
.restore-button i.fa.fa-undo {
    font-size: 14px;
    line-height: normal !important;
    margin: 0px !important;
    color: #FFF;
}
button#addTransactionButton {
    background: #FFC107;
    border: #FFC107;
}
</style>

<x-admin.page-header title="All Transactions" subtitle="Manage transaction records">
    <button type="button" class="btn btn-primary premium-btn" id="addTransactionButton" data-bs-toggle="modal" data-bs-target="#editModal" onclick="resetFormAndTitle()">
        <i class="fa fa-plus"></i> Add Transaction
    </button>
</x-admin.page-header>

<div class="premium-card">
    <div class="premium-card__body">
        <x-admin.filter-bar table-id="all_transactions" :show-export="true" :show-date-filter="true" />

        <div id="transactionsSkeleton" class="table-skeleton-wrapper">
            <x-admin.skeleton-loader type="table" :rows="5" :cols="8" />
        </div>

        <div id="transactionsEmpty" style="display:none;">
            <x-admin.empty-state icon="fa-credit-card" title="No transactions found" message="Create your first transaction to get started." action-text="Add Transaction" action-modal="editModal" />
        </div>

        <div class="custom-tabs-container request-tab-all">
            <div class="table-responsive">
                <table id="all_transactions" class="table table-striped app-responsive-table" style="width:100%">
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Transaction ID</th>
                            <th>Company Name</th>
                            <th>Sender Partner Name</th>
                            <th>Receiver Partner Name</th>
                            <th>Coins</th>
                            <th>Rate</th>
                            <th>Remarks</th>
                            <th>Receiver Opening Balance</th>
                            <th>Receiver Closing Balance</th>
                            <th>Sender Opening Balance</th>
                            <th>Sender Closing Balance</th>
                            <th>Created At</th>
                            <th>Modified</th>
                            <th>Deleted</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Edit/Add Transaction Modal -->
<x-admin.edit-modal modal-id="editModal" title="Edit Transaction">
    <form id="editTransactionForm">
        @csrf
        <div class="modal-body">
            <input type="hidden" name="transaction_id" id="transaction_id">
            <div class="mb-3">
                <label>Company Name</label>
                <select id="company_id" class="form-control" style="text-transform: uppercase;">
                    <option value="">Select Company</option>
                    @foreach($companies as $company)
                        <option value="{{$company->company_id}}">{{$company->name}}</option>
                    @endforeach
                </select>
            </div>
            <div class="mb-3">
                <label>Receiver Partner Name</label>
                <select id="Name_id_name" name="name_id" class="form-control" style="text-transform: uppercase;">
                    <option value="">Select</option>
                </select>
            </div>
            <div class="mb-3">
                <label>Balance</label>
                <input type="text" class="form-control" id="Balance_put" placeholder="" readonly="">
            </div>
            <div class="mb-3">
                <label>Sender Partner Name</label>
                <select id="Product_id_name" name="product_id" class="form-control" style="text-transform: uppercase;">
                    <option value="">Select</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="coins" class="form-label">Coins</label>
                <input type="text" class="form-control" name="coins" id="coins" placeholder="">
            </div>
            <div class="mb-3">
                <label for="rate" class="form-label">Rate</label>
                <input type="text" class="form-control" id="rate" name="rate">
            </div>
            <div class="mb-3">
                <label for="remarks" class="form-label">Remarks</label>
                <textarea class="form-control" id="remarks" name="remarks"></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
    </form>
</x-admin.edit-modal>

@endsection

@section('scripts')
@parent

<script type="text/javascript">
function resetFormAndTitle() {
    $('#transaction_id').val('');
    $('#name_id').val('');
    $('#Name_id_name').val('');
    $('#product_id').val('');
    $('#Product_id_name').val('');
    $('#coins').val('');
    $('#rate').val('');
    $('#remarks').val('');
    $('#company_id').val('').prop('disabled',false);
    $('#Balance_put').val('');
    $('#editModalLabel').text('Add Transaction');
    $('#Name_id_name, #Product_id_name').empty();
}

$('#addTransactionButton').on('click', function() {
    resetFormAndTitle();
});

$(document).ready(function () {
    $('#company_id').on('change', function () {
        const companyId = $(this).val();
        if (!companyId) {
            $('#Name_id_name, #Product_id_name').empty();
            $('#Balance_put').val('');
            return;
        }
        const url = "{{ route('getPartnersByCompany', ':companyId') }}".replace(':companyId', companyId);
        $('#Name_id_name, #Product_id_name').empty();
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                if (data.length === 0) {
                    $('#Name_id_name, #Product_id_name').append('<option value="">No partners found</option>');
                    return;
                }
                data.forEach(partner => {
                    const option = `<option value="${partner.id}" data-balance="${partner.balance}">${partner.name}</option>`;
                    $('#Name_id_name').append(option);
                    $('#Product_id_name').append(option);
                });
                $('#Name_id_name').trigger('change');
            },
            error: function (error) {
                console.error('Error fetching partners:', error);
            }
        });
    });
});

var transactionsTable = initRealtimeTable('all_transactions', '/api/transactions', [
    { data: 'sn' },
    { data: 'transaction_id' },
    { data: 'company_name' },
    { data: 'name_id_name' },
    { data: 'product_id_name' },
    { data: 'coins' },
    { data: 'rate' },
    { data: 'remarks' },
    { data: 'product_opening_balance' },
    { data: 'product_closing_balance' },
    { data: 'name_opening_balance' },
    { data: 'name_closing_balance' },
    { data: 'created_at' },
    {
        data: 'modified',
        render: function(data) {
            if (data === 'Yes') return '<span class="premium-badge premium-badge--warning">Yes</span>';
            return '<span class="premium-badge premium-badge--default">No</span>';
        }
    },
    {
        data: 'deleted',
        render: function(data) {
            if (data === 'Yes') return '<span class="premium-badge premium-badge--danger">Yes</span>';
            return '<span class="premium-badge premium-badge--default">No</span>';
        }
    },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
            return '<button class="btn btn-primary btn-sm edit-button" data-bs-toggle="modal" data-bs-target="#editModal" data-transaction-id="' + row.transaction_id + '" data-name-id="' + row.name_id + '" data-product-id="' + row.product_id + '" data-coins="' + row.coins + '" data-rate="' + row.rate + '" data-remarks="' + (row.remarks || '') + '" data-company_id="' + row.company_id + '"><i class="fas fa-pen"></i></button> ' +
            '<button class="btn btn-danger btn-sm delete-button" data-transaction-id="' + row.transaction_id + '"><i class="fa fa-trash-can"></i></button> ' +
            '<button class="btn btn-danger btn-sm restore-button" data-transaction-id="' + row.transaction_id + '"><i class="fa fa-undo"></i></button> ' +
            '<button class="btn btn-danger btn-sm delete_parmanent-button" data-transaction-id="' + row.transaction_id + '"><span class="icon-stack"><i class="fa-solid fa-trash-can"></i><i class="fa-solid fa-xmark"></i></span></button>';
        }
    }
]);

// Hide skeleton + show empty state
$('#all_transactions').on('init.dt', function() { $('#transactionsSkeleton').hide(); });
$('#all_transactions').on('xhr.dt', function(e, settings, json) {
    $('#transactionsSkeleton').hide();
    if (json && json.data && json.data.length === 0) { $('#transactionsEmpty').show(); } else { $('#transactionsEmpty').hide(); }
});

// Date range filter
$('#all_transactionsDateApply').on('click', function() {
    var from = $('#all_transactionsDateFrom').val();
    var to = $('#all_transactionsDateTo').val();
    $.fn.dataTable.ext.search.push(function(settings, data) {
        if (settings.nTable.id !== 'all_transactions') return true;
        var date = data[12] || '';
        if (from && date < from) return false;
        if (to && date > to + ' 23:59:59') return false;
        return true;
    });
    transactionsTable.draw();
    $.fn.dataTable.ext.search.pop();
});

$(document).on('click', '.edit-button', function() {
    const companyId = $(this).data('company_id');
    const transactionId = $(this).data('transaction-id');
    const nameId = $(this).data('name-id');
    const productId = $(this).data('product-id');
    const coins = $(this).data('coins');
    const rate = $(this).data('rate');
    const remarks = $(this).data('remarks');

    $('#transaction_id').val(transactionId);
    $('#Name_id_name').val(nameId);
    $('#Product_id_name').val(productId);
    $('#coins').val(coins);
    $('#rate').val(rate);
    $('#remarks').val(remarks);
    $('#company_id').val(companyId);
    $('#company_id').prop('disabled', true);
    $('#editModalLabel').text('Edit Transaction');

    const url = "{{ route('getPartnersByCompany', ':companyId') }}".replace(':companyId', companyId);
    $('#Name_id_name, #Product_id_name').empty();
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            data.forEach(partner => {
                const option = `<option value="${partner.id}" data-balance="${partner.balance}">${partner.name}</option>`;
                $('#Name_id_name').append(option);
                $('#Product_id_name').append(option);
            });
            $('#Name_id_name').val(nameId);
            $('#Product_id_name').val(productId);
            const selectedOption = $('#Name_id_name').find(':selected');
            const balance = selectedOption.data('balance');
            $('#Balance_put').val(balance || '');
        },
        error: function (error) {
            console.error('Error fetching partners:', error);
        }
    });
});

$(document).ready(function() {
    $('#Name_id_name').on('change', function() {
        const selectedOption = $(this).find(':selected');
        const balance = selectedOption.data('balance');
        $('#Balance_put').val(balance);
    });

    $('#Product_id_name').on('change', function() {
        const nameId = $('#Name_id_name').val();
        const productId = $('#Product_id_name').val();
        if (nameId === productId) {
            Swal.fire({ icon: 'error', title: 'Invalid Selection', text: 'Sender and receiver should be different!' });
            $('#Product_id_name').val('');
        }
    });
});

$(document).ready(function () {
    $('#editTransactionForm').on('submit', function (e) {
        e.preventDefault();
        const nameId = $('#Name_id_name').val();
        const productId = $('#Product_id_name').val();
        if (nameId === productId) {
            Swal.fire({ icon: 'error', title: 'Invalid Selection', text: 'Sender and receiver should be different!' });
            $('#Product_id_name').val('');
            return;
        }
        $.ajax({
            url: "{{ route('user.update-transaction') }}",
            method: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                Swal.fire({ icon: 'success', title: 'Success', text: response.message, confirmButtonText: 'OK' }).then(function() { location.reload(); });
            },
            error: function (xhr, status, error) {
                Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to add/update the transaction. Please try again.' });
            }
        });
    });
});

$(document).on('click', '.restore-button', function() {
    const transactionId = $(this).data('transaction-id');
    var csrfToken = $('meta[name="csrf-token"]').attr('content');
    Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to Restore this transaction?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: 'Restore',
        cancelButtonText: 'Cancel',
    }).then(function(result) {
        if (result.isConfirmed) {
            $.ajax({
                url: "{{ route('transactions.restore') }}",
                method: 'POST',
                data: { _token: csrfToken, transaction_id: transactionId },
                success: function(response) {
                    if (response.success) {
                        Swal.fire("Restored!", "The transaction has been restored.", "success");
                        location.reload();
                    } else {
                        Swal.fire("Error", response.message, "error");
                    }
                },
                error: function(xhr) {
                    Swal.fire("Error", "An error occurred: " + xhr.responseText, "error");
                }
            });
        }
    });
});

$(document).on('click', '.delete-button', function() {
    const transactionId = $(this).data('transaction-id');
    var csrfToken = $('meta[name="csrf-token"]').attr('content');
    Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to Soft delete this transaction?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
    }).then(function(result) {
        if (result.isConfirmed) {
            $.ajax({
                url: "{{ route('transactions.delete') }}",
                method: 'POST',
                data: { _token: csrfToken, transaction_id: transactionId },
                success: function(response) {
                    if (response.success) {
                        Swal.fire("Deleted!", "The transaction has been deleted.", "success");
                        location.reload();
                    } else {
                        Swal.fire("Error", response.message, "error");
                    }
                },
                error: function(xhr) {
                    Swal.fire("Error", "An error occurred: " + xhr.responseText, "error");
                }
            });
        }
    });
});

$(document).on('click', '.delete_parmanent-button', function() {
    const transactionId = $(this).data('transaction-id');
    var csrfToken = $('meta[name="csrf-token"]').attr('content');
    Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this transaction? You can't restore it back.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
    }).then(function(result) {
        if (result.isConfirmed) {
            $.ajax({
                url: "{{ route('transactions.delete_parmanent') }}",
                method: 'POST',
                data: { _token: csrfToken, transaction_id: transactionId },
                success: function(response) {
                    if (response.success) {
                        Swal.fire("Deleted!", "The transaction has been deleted.", "success");
                        location.reload();
                    } else {
                        Swal.fire("Error", response.message, "error");
                    }
                },
                error: function(xhr) {
                    Swal.fire("Error", "An error occurred: " + xhr.responseText, "error");
                }
            });
        }
    });
});
</script>

@endsection

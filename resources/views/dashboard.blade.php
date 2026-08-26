@extends('layouts.admin')
@section('content')
<style>

section.overview-sec {
    padding-top: 2%;
    padding-bottom: 1%;
    border-bottom: 2px solid #ff6f01e6;
}
.overview-txt h2 {
    font-size: 32px;
    font-weight: 600;
    color: #000;
}
.modal-company {
    display: flex;
    justify-content: end;
    gap: 10px;
    align-items: normal;
}
.modal-company .add-company {
    background: #FFC107;
    border: #FFC107;
    font-size: 16px;
    font-weight: 600;
}
.modal-company .add-company:active {
    background: #FFC107;
}
.modal-company .login-div input#exampleInputEmail1 {
    border-radius: 5px;
    padding: 10px 15px;
    border: 1px solid #6f4e4e;
    margin-bottom: 0px;
}
.modal-company .login-div {
    padding: 0px;
}
.modal-company .floating-label {
    position: absolute;
    left: 25px;
    top: 19%;
    transform: translateY(-5%);
    transition: all 0.2s ease;
    color: #666;
    pointer-events: none;
    background: #FFF;
    font-size: 18px;
    font-weight: 600;
    padding: 0px 2px;
}
.modal-company .login-div .form-group {
    position: relative;
    margin-bottom: 0px;
}
.modal-footer.add-company-footer {
    border-top: 0px;
}
.modal-header.modal-company-header {
    border-bottom: 0px;
}
.modal-body.modal-company-body {
    padding: 0px 15px;
}
.modal-body i.fas.fa-city {
    margin-right: 10px;
    color: #0064ff;
}
.add-company-footer .Create-btn {
    background: #FFC107;
    border: #FFC107;
    font-weight: 600;
}
.add-company-footer .Cancel-btn {
    font-weight: 600;
}
.modal-company-header h1 {
    font-weight: 600;
}
.modal-header.modal-company-header {
    padding-bottom: 10px;
}
.modal-company .inactive-comp {
    background: #ff4300;
    border: transparent;
    border-radius: 50%;
    padding: 8px 10px;
}
.company-table tbody, td, tfoot, th, thead{
    border-style: none;
}
.company-table .modal-body {
    width: 90%;
    margin: auto;
    padding: 0px;
}
.company-table .modal-header {
    border-bottom: 0px;
}
.modal-footer.company-table-footer {
    border-top: 0px;
    padding-bottom: 25px;
}
.company-table-footer button.btn.btn-secondary {
    background: #FFC107;
    width: 100%;
    border: #FFC107;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}


        .table-container {
            width: 50%;
            margin: 20px auto;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-row th {
    padding: 10px;
    border: 1px solid #f0e1aa;
    font-size: 14px;
    font-weight: normal;
    text-align: center;
}
.company-table tbody {
    text-align: center;
}
.company-table tbody th, td {
    padding: 15px 0px;
}
.company-table tbody tr {
    border-bottom: 1px solid #f9a203;
}


        .header-row {
    background-color: #FFEEBB;
    font-weight: bold;
}
        .company-table i.fa.fa-check-circle {
    font-size: 18px;
    color: #FFF;
    background: #03be03;
    padding: 8px 8px;
    border-radius: 10px;
}
.add-company i.fa.fa-plus {
    font-size: 14px;
}


/* tab-css */

.nav-tabs .nav-link.active {
    background-color: #f1c40f;
    color: #000;
    border-radius: 0px;
}
        .nav-tabs .nav-link {
            color: #999;
        }
        .nav-tabs {
            border-bottom: none;
        }
        .tab-content {
    padding: 15px;
    border-top: none;
    padding-left: 0px;
    padding-right: 0px;
}
        .overview-tab-sec li.nav-item {
    width: 50%;
    text-align: center;
}
.overview-tab-sec a.nav-link {
    font-size: 18px;
    font-weight: 600;
}
.overview-tab-sec ul.nav.nav-tabs {
    border: 2px solid #FFC107;
    border-radius: 4px;
}
        /* end tab css */

        .vlbook-grid a {
    text-decoration: none;
    color: #000;
}
.vlbook-grid p {
    margin-bottom: 0px;
    font-size: 16px;
    font-weight: normal;
}
.vlbook-grid h2 {
    font-size: 18px;
    margin-bottom: 0px;
}
.vlbook-grid {
    padding: 10px 20px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    border-radius: 10px;
}
.row.grid-temp-row {
    margin-bottom: 2%;
}
li.nav-item.boder-right {
    border-right: 2px solid #FFC107;
}

.table-viwe th:nth-child(1) {
    border-radius: 10px 0px 0px 0px;
    border-right: 0px !important;
}
.table-viwe th:nth-child(2) {
    border-radius: 0px 0px 0px 0px;
    border-left: 0px !important;
    border-right: 0px !important;
}
.table-viwe th:nth-child(3) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.table-viwe th:nth-child(4) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.table-viwe th:nth-child(5) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.table-viwe th:nth-child(6) {
    border-radius: 0px 10px 0px 0px;
    border-left: 0px !important;
}
.table-viwe th {
    background: #FFEEBB !important;
    color: #000 !important;
    border: 2px solid #FF9800;
    border-radius: 10px 10px 0px 0px;
}
.table-viwe th::before {
display: none !important;
}
.table-viwe th::after {
display: none !important;
}
.table-viwe th {
    text-align: center !important;
}
.table-viwe table.dataTable.table-striped>tbody>tr>* {
    box-shadow: none !important;
    text-align: center !important;
}
.table-viwe td {
    border-bottom: 2px solid#FF9800;
}
.table-viwe .cross {
    background-color: #FF5722 !important;
    border: #FF5722;
}
.table-viwe i.fa.fa-times-circle {
    font-size: 18px;
}
.btn-action .gear {
    background: #FFc107 !important;
}
.btn-action .gear {
    background: #FFc107 !important;
    border: #FFC107;
}
.btn-action i.fa.fa-gear {
    font-size: 18px;
}
.inactive-mod-footer button.btn.btn-primary {
    background: #FF5722;
    border: #FF5722;
}
.inactive-mod-footer button {
    font-size: 16px;
    font-weight: 600;
}
.modal-footer.inactive-mod-footer {
    border-top: 0px;
    padding-top: 0px;
}
.inactive-mod .modal-body {
    padding-bottom: 0px;
}
.inactive-mod h1#exampleModalLabel {
    font-size: 18px;
    font-weight: 600;
    line-height: normal;
}
.login-div.setting-div {
    box-shadow: none;
    border-radius: 0px;
    padding: 0px;
}
.setting-div input#exampleInputEmail1 {
    border-radius: 10px;
    padding: 10px 10px;
    border: 1px solid #757575;
    margin-top: 5px;
    margin-bottom: 0px !important;
}
.setting-div .floating-label {
    top: 23%;
}
.setting-div .form-group {
    margin-bottom: 0px;
}
table#inactivecompaniesTable {
    width: 100% !important;
}

/*.remove-extra table#DataTables_Table_0 {
    margin: 0px !important;
    border: 2px solid orange;
    border-radius: 10px;
}*/
/*.remove-extra .col-sm-12.col-md-6 {
    display: none;
}
.remove-extra .col-sm-12.col-md-6 {
    display: none;
}
.remove-extra .col-sm-12.col-md-5 {
    display: none;
}
.remove-extra .col-sm-12.col-md-7 {
    display: none;
}*/
/*.remove-extra th {
    padding: 5px 5px;
    text-align: center !important;
}*/
/*.remove-after th::after {
    display: none !important;
}
.remove-after th::before {
    display: none !important;
}*/
/*.remove-extra th:nth-child(1) {
    border-radius: 10px 0px 0px 0px;
    border-right: 0px !important;
}
.remove-extra th:nth-child(2) {
    border-radius: 0px 0px 0px 0px;
    border-left: 0px !important;
    border-right: 0px !important;
}
.remove-extra th:nth-child(3) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.remove-extra th:nth-child(4) {
    border-radius: 0px 10px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}*/



#inactivecompaniesTable_filter label {
    white-space: break-spaces !important;
}
#staticBackdrop .modal-dialog.company-table {
    width: 100% !important;
    max-width: 45% !important;
}
#companiesTable td {
    padding: 5px 0px !important;
}
#companiesTable button.btn.btn-danger.make-inactive {
    line-height: normal !important;
    padding: 4px 10px;
    font-size: 14px;
    margin-right: 10px;
}
#companiesTable button.btn.btn-warning.edit-company {
    line-height: normal !important;
    padding: 4px 10px;
    font-size: 14px;
}




@media(min-width: 240px) and (max-width: 479px) {


#inactivecompaniesTable_filter label {
    white-space: break-spaces !important;
}
#staticBackdrop .modal-dialog.company-table {
    width: 100% !important;
    max-width: 100% !important;
}


section.overview-sec {
    padding-top: 4%;
    padding-bottom: 4%;
}
.modal-company {
    justify-content: center;
}
.overview-txt {
    text-align: center;
    margin-bottom: 15px;
}
.table_companies {
    overflow: hidden;
    overflow-x: scroll;
}
.table_companies th, td {
    white-space: nowrap;
}
.table_companies button.btn.btn-danger.make-inactive {
    margin-right: 5px;
}
}



@media(min-width: 480px) and (max-width: 767px) {


#inactivecompaniesTable_filter label {
    white-space: break-spaces !important;
}
#staticBackdrop .modal-dialog.company-table {
    width: 100% !important;
    max-width: 100% !important;
}
section.overview-sec {
    padding-top: 4%;
    padding-bottom: 4%;
}
.modal-company {
    justify-content: center;
}
.overview-txt {
    text-align: center;
    margin-bottom: 15px;
}
.table_companies {
    overflow: hidden;
    overflow-x: scroll;
}
.table_companies th, td {
    white-space: nowrap;
}
.table_companies button.btn.btn-danger.make-inactive {
    margin-right: 5px;
}
}


@media(min-width: 768px) and (max-width: 999px) {

#inactivecompaniesTable_filter label {
    white-space: break-spaces !important;
}
#staticBackdrop .modal-dialog.company-table {
    width: 100% !important;
    max-width: 80% !important;
}
}


</style>

 <section class="overview-sec">
        <div class="container">
            <div class="row">
                <div class="col-sm-12">
                    <div class="overview-txt">
                        <h2>Companies Overview</h2>
                    </div>
                </div>

                <div class="col-sm-12">
                   
                    <div class="modal-company">


 @if(Auth::user()->is_admin)                       
<!-- Button trigger modal -->
<button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#exampleModal">
    <i class="fa fa-plus"></i> New Company
  </button>

@endif
  
  

<!-- Button trigger modal -->
<button type="button" class="btn btn-primary inactive-comp" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
    <i class='fas fa-city'></i>
  </button>
  
  

 <div class="modal fade" id="staticBackdrop" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog company-table">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">Inactive Companies</h1>
        </div>
        <div class="modal-body remove-extra">
            <div class="table-responsive">
                <table id="inactivecompaniesTable" class="app-responsive-table app-responsive-table--compact">
                    <thead class="remove-after">
                        <tr class="header-row">
                            <th></th>
                            <th>Company Name</th>
                            <th>Total Users</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    
                </table>
            </div>
        
        </div>
        <div class="modal-footer company-table-footer">
          <button type="close" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
</div>








 <!-- Modal -->
                               <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form method="post" id="create_company_form">
            @csrf
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Create New Company</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body modal-company-body">
                   <div class="login-div">
                    <div class="form-group">
                        <input type="text" name="name" class="form-control" id="exampleInputEmail1" placeholder="" required>
                        <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-city'></i>Enter New Company</label>
                    </div>
                </div>
                </div>
                <div class="modal-footer add-company-footer">
                    <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-primary Create-btn" id="submitCompanyBtn">Save changes</button>
                </div>
            </div>
        </form>
    </div>
</div>





<div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form method="post" id="edit_company_form">
            @csrf
            <div class="modal-content">
        <div class="modal-header modal-company-header company-setting">
          <h1 class="modal-title fs-5" id="exampleModalLabel">Company Settings</h1>
        </div>
        <div class="modal-body modal-company-body">
            <div class="login-div setting-div">


                    <input type="hidden" name="id" id="editid" class="form-control" placeholder="Enter Company Name" >
                    

                    <div class="form-group">
                        <input type="text" class="form-control" name="name" id="editname"  placeholder="">
                        <label class="floating-label"  for="exampleInputEmail1"><i class='fas fa-city'></i>Edit Company Name</label>
                    </div>


               </div>
        </div>
        <div class="modal-footer add-company-footer">
                    <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-primary Create-btn" id="submitCompanyBtn">Save changes</button>
                </div>
            </div>
        </form>
    </div>
</div>







                    </div>
                <!-- modal-strt new-company -->

                </div>

            </div>
        </div>
    </section>


    <section class="overview-tab-sec">
        <div class="container my-3">
            <ul class="nav nav-tabs">
                <li class="nav-item boder-right">
                    <a class="nav-link active" data-bs-toggle="tab" href="#grid-view">Grid View</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#list-view">List View</a>
                </li>
            </ul>
        
            <div class="tab-content">
                <div id="grid-view" class="tab-pane fade show active">
                    <div class="row grid-temp-row">

                </div>
                </div>




<!-- Modal inactive -->
<div class="modal fade inactive-mod" id="exampleModal1" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- <div class="modal-header">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div> -->
        <div class="modal-body">
            <h1 class="modal-title fs-5" id="exampleModalLabel">Are you sure you want to make this company inactive</h1>
        </div>
        <div class="modal-footer inactive-mod-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary">Make Inactive</button>
        </div>
      </div>
    </div>
  </div>
  <!--  -->





                <div id="list-view" class="tab-pane fade table-viwe">
                    <div class="modal-body">
                        <div class="table_companies">
                            <div class="table-responsive">
                        <table id="companiesTable" class="table table-striped app-responsive-table" style="width:100%">
                            <thead>
                              <tr>
                                <th></th>
                                <th>Company Name</th>
                                <th>Active Users</th>
                                <th>Inactive Users</th>
                                <th>Total Users</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            
                        </table>
                            </div>
                      </div>
                
                </div>
                </div>
            </div>
        </div>
    </section>




@endsection
@section('scripts')
@parent



<script type="text/javascript">
    $(document).ready(function() {

        // Function to initialize DataTables
        function initializeDataTables() {
            // Initialize inactive companies table
            var inactiveTable = $('#inactivecompaniesTable').DataTable({
                processing: true,
                serverSide: false,
                ajax: {
                    url: "{{ route('companies.inactivedata') }}",
                    type: 'GET',
                    dataSrc: ''
                },
                columns: [
                    { data: 'id', name: 'id', visible: false },
                    { data: 'name', name: 'name' },
                    { data: 'total_partners', name: 'total_partners' },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: function(data, type, row) {
                            return '<button class="make-active" onclick="Activeme(' + row.id + ')" data-id="' + row.id + '"><i class="fa fa-check-circle"></i></button>';
                        }
                    }
                ],
                order: [[0, 'asc']]
            });

            // Initialize active companies table
            window.table = $('#companiesTable').DataTable({
                processing: true,
                serverSide: false,
                ajax: {
                    url: "{{ route('companies.data') }}",
                    type: 'GET',
                    dataSrc: ''
                },
                columns: [
                    { data: 'id', name: 'id', visible: false },
                    {
                        data: 'name',
                        name: 'name',
                        render: function(data, type, row) {
                            var companyInfoUrl = "{{ url('/c') }}/" + row.id;
                            return `<a href="${companyInfoUrl}">${data}</a>`;
                        }
                    },
                    { data: 'active_partners', name: 'active_partners' },
                    { data: 'inactive_partners', name: 'inactive_partners' },
                    { data: 'total_partners', name: 'total_partners' },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: function(data, type, row) {
                            return row.access_level === 'full' ?
                                '<button class="btn btn-danger make-inactive" data-id="' + row.id + '"><i class="fa fa-times-circle"></i></button>' +
                                '<button class="btn btn-warning edit-company" data-id="' + row.id + '" data-name="' + row.name + '" data-bs-toggle="modal" data-bs-target="#editModal"><i class="fa fa-gear"></i></button>' :
                                '<span>Readonly Access</span>';
                        }
                    }
                ],
                order: [[0, 'asc']]
            });
        }

        // Function to bind events for dynamic elements
        function bindEvents() {
            // Bind edit button click event
            $(document).on('click', '.edit-company', function() {
                var companyId = $(this).data('id');
                var companyName = $(this).data('name');
                $("#editid").val(companyId);
                $("#editname").val(companyName);
            });

            // Bind make-active button click event
            $(document).on('click', '.make-active', function() {
                var companyId = $(this).data('id');
                makeActive(companyId);
            });

            // Bind make-inactive button click event
            $(document).on('click', '.make-inactive', function() {
                var companyId = $(this).data('id');
                makeInactive(companyId);
            });
        }

        // Function to make a company active
        function makeActive(companyId) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'This will make the company active.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, make active'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: "{{ route('make-active', ':id') }}".replace(':id', companyId),
                        type: 'PATCH',
                        data: { _token: '{{ csrf_token() }}' },
                        success: function(response) {
                            reloadTables();
                            Swal.fire('Success', 'Company marked as active successfully!', 'success');
                        },
                        error: function(xhr) {
                            console.log(xhr.responseText);
                            Swal.fire('Error', 'An error occurred while making the company active.', 'error');
                        }
                    });
                }
            });
        }

        // Function to make a company inactive
        function makeInactive(companyId) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'This will make the company inactive.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, make inactive'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: "{{ route('make-inactive', ':id') }}".replace(':id', companyId),
                        type: 'PATCH',
                        data: { _token: '{{ csrf_token() }}' },
                        success: function(response) {
                            reloadTables();
                            Swal.fire('Success', 'Company marked as inactive successfully!', 'success');
                        },
                        error: function(xhr) {
                            console.log(xhr.responseText);
                            Swal.fire('Error', 'An error occurred while making the company inactive.', 'error');
                        }
                    });
                }
            });
        }

        // Reload both tables
        function reloadTables() {
            loadGridData();
            window.table.ajax.reload(null, false);
        }

        // Load data for grid display
        function loadGridData() {
            $.ajax({
                url: "{{ route('companies.data') }}",
                type: 'GET',
                success: function(response) {
                    $('.grid-temp-row').empty();
                    $.each(response, function(index, company) {
                        var companyInfoUrl = "{{ url('/c') }}/" + company.id;
                        var html = `
                            <div class="col-sm-4">
                                <div class="vlbook-grid">
                                    <a href="${companyInfoUrl}">
                                        <h2>${company.name}</h2>
                                        <p>Active Users: ${company.active_partners}</p>
                                        <p>Inactive Users: ${company.inactive_partners}</p>
                                    </a>
                                </div>
                            </div>
                        `;
                        $('.grid-temp-row').append(html);
                    });
                },
                error: function(xhr) {
                    console.log(xhr.responseText);
                    Swal.fire('Error', 'An error occurred while loading the grid data.', 'error');
                }
            });
        }

        // Form submission for creating company
        $('#create_company_form').on('submit', function(e) {
            e.preventDefault();
            $.ajax({
                url: "{{ route('create-company') }}",
                type: 'POST',
                data: $(this).serialize(),
                success: function(response) {
                    $('#create_company_form')[0].reset();
                    reloadTables();
                    Swal.fire('Success', 'Company created successfully!', 'success');
                },
                error: function(xhr) {
                    console.log(xhr.responseText);
                    Swal.fire('Error', xhr.responseJSON.message, 'error');
                }
            });
        });

        // Form submission for editing company
        $('#edit_company_form').on('submit', function(e) {
            e.preventDefault();
            $.ajax({
                url: "{{ route('edit-company') }}",
                type: 'POST',
                data: $(this).serialize(),
                success: function(response) {
                    $('#edit_company_form')[0].reset();
                    reloadTables();
                    Swal.fire('Success', 'Company edited successfully!', 'success');
                },
                error: function(xhr) {
                    console.log(xhr.responseText);
                    Swal.fire('Error', xhr.responseJSON.message, 'error');
                }
            });
        });

        // Initialize tables and bind events
        initializeDataTables();
        loadGridData();
        bindEvents();

        // Auto-refresh the data every 30 seconds
        // setInterval(reloadTables, 30000);
    });
</script>








@endsection
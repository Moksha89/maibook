<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">


@php
use Illuminate\Support\Facades\DB;

// Fetch the logo path from the database (assuming the column name is `logo`)
$logoPath = DB::table('logo')->where('id', 1)->value('logo');

// Generate a full URL to the logo if it exists; otherwise, use a default logo
$logoUrl = $logoPath ? asset($logoPath) : asset('default-logo.png');


$title=Db::table('website_title')->where('id',1)->value('title');


@endphp
    <title>{{$title}}</title>
    <link rel="shortcut icon" sizes="32x32" href="{{$logoUrl}}" type="image/x-icon" />


    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link rel="stylesheet" href="{{asset('css/style.css')}}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">
    <script src='https://kit.fontawesome.com/a076d05399.js' crossorigin='anonymous'></script>
    <!--link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet"-->
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.5/css/dataTables.bootstrap5.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

<link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">

  


  
</head>
<style>

.settling-pen {
    line-height: normal;
    font-size: 14px;
}
.settling-report {
    line-height: normal;
    font-size: 14px;
}




#pagination {
    justify-content: end;
    padding: 0px 10px;
}

    .container {
    width: 100%;
    max-width: 100%;
}
    .navbar-sec i.fa.fa-home {
    margin-right: 10px;
    color: #000;
    font-size: 25px;
}
header.menu-head-sec {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.navbar-sec nav.navbar.navbar-dark.bg-dark.fixed-top.back-new {
    background: #FFF !important;
    position: sticky;
    padding: 5px 0px 5px 0px;
}
.navbar-sec a.navbar-brand {
    color: #000;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
}
.logout-btn i.fa.fa-gear {
    font-size: 20px;
    margin-right: 0px;
    color: #FFF;
}
/* .gear-sett {
    background: #FFC107;
    padding: 7px 9px 7px 10px;
    border-radius: 50px;
    width: 40px;
}
.gear-sett a {
    padding: 0px !important;
} */

.gear-sett button.btn.btn-primary.gear {
    background: #FFC107;
    padding: 7px 8px 6px 8px;
    border-radius: 50px;
    border: #FFC107;
    line-height: normal;
    font-size: 14px;
}
.logout-btn {
    display: flex;
    align-items: center;
    position: relative;
    gap: 5px;
}
.logout-btn a {
    color: #000;
    font-size: 14px;
    text-decoration: none;
    font-weight: 600;
}
/* .logout-btn::after {
    content: '';
    border-left: 2px solid #000000e0;
    position: absolute;
    top: 5px;
    width: 100%;
    height: 70%;
    right: 30px;
    background-repeat: no-repeat;
} */
.logout-btn i {
    margin-right: 10px;
    font-size: 14px;
}


.active-tab {
    background-color: #FFC107;
    color: white;
}

.menu-head-sec a {
    padding: 10px 15px;
    color: black;
    text-decoration: none;
    position: relative;
    z-index: 999;
    line-height: normal;
    font-size: 14px;
}

    .menu-head-sec a:hover {
        background-color: #FFC107 !important;
        color: white;
    }


    .custom-search-bar {
            background-color: #fff3cd; /* Light yellow background */
            border: 2px solid orange; /* Orange border */
            border-radius: 5px; /* Slightly rounded corners */
            padding: 5px 10px;
            display: flex;
            align-items: center;
            position: relative;
        }
        .custom-search-bar input {
            border: none;
            background: none;
            outline: none;
            width: 100%;
            padding-left: 10px;
            font-size: 12px;
            color: #84754e; /* Text color similar to the image */
        }
        .custom-search-bar .search-icon {
            font-size: 20px;
            color: #84754e; /* Search icon color similar to the image */
        }
        .entries {
    display: flex;
    justify-content: space-between;
}


.entries p {
    margin-bottom: 0px;
}
.entries p {
    margin-bottom: 0px;
    font-size: 16px;
    font-weight: 700;
    color: #2196F3;
}
.entries p.clossing {
    color: #000;
    font-weight: 400;
}
.clossing span {
    font-weight: 600;
    color: #2196F3;
}
.data-table-new th {
    font-size: 15px;
    font-weight: normal;
    text-align: center !important;
}
.data-table-new td {
    text-align: center;
    font-size: 14px;
    box-shadow: none !important;
    border: 0px;
}

.data-table-new th:nth-child(1) {
    border-radius: 10px 0px 0px 0px;
    border-right: 0px !important;
}
.data-table-new th:nth-child(2) {
    border-radius: 0px 0px 0px 0px;
    border-left: 0px !important;
    border-right: 0px !important;
}
.data-table-new th:nth-child(3) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(4) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(5) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(6) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(7) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(8) {
    border-radius: 0px 0px 0px 0px;
    border-right: 0px !important;
    border-left: 0px !important;
}
.data-table-new th:nth-child(9) {
    border-radius: 0px 10px 0px 0px;
    border-left: 0px !important;
}
.data-table-new th {
    background: #FFEEBB !important;
    color: #000 !important;
    border: 2px solid #FF9800;
}
.data-table-new th::before {
display: none !important;
}
.data-table-new th::after {
display: none !important;
}

.data-table-new div#example_info {
    border: 1px solid #FF9800;
    border-right: 0px;
    border-top: 0px;
    border-radius: 0px 0px 0px 10px;
    padding-bottom: 10px;
}
.data-table-new .col-sm-12.col-md-5 {
    width: 50%;
    padding-right: 0;
}
.data-table-new .col-sm-12.col-md-7 {
    width: 50%;
    padding-left: 0;
}
.data-table-new div#example_paginate {
    border: 1px solid #FF9800;
    border-left: 0px;
    border-top: 0px;
    border-radius: 0px 0px 10px 0px;
    padding-bottom: 5px;
    padding-top: 6.8px;
}
.data-table-new table#example {
    border: 1px solid #FF9800;
    border-bottom: 0px;
    margin-bottom: 0px !important;
    border-radius: 10px 10px 0px 0px;
}
.data-table-new ul.pagination {
    margin: 0px !important;
}
.data-table-new li#example_previous a {
    background: transparent !important;
    border: 0px;
}
.data-table-new li#example_next a {
    background: transparent !important;
    border: 0px;
}
.data-table-new li.paginate_button.page-item.active a {
    background: #FFC107;
    border: #FFC107;
    border-radius: 10px;
}
.settling-report button.btn.btn-primary {
    z-index: 999;
    position: relative;
    background: transparent;
    color: #000;
    padding: 10px 15px;
    font-size: 14px;
    border: 0px;
}
.report-mod-full .modal-dialog {
    width: 100%;
    max-width: 95%;
    height: auto;
}
.report-mod-full .modal-header {
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 0px;
}
.report-body .col-sm-6 {
    width: 49%;
}
.modal-body.report-body {
    display: flex;
    height: 400px;
    gap: 2%;
}
.report-body table {
    width: 100%;
    text-align: center;
}
.report-body tr {
    width: 100% !important;
}
.report-body th {
    font-size: 16px;
    font-weight: 600;
    color: #000;
}
.report-footer button {
    width: 49%;
}
.modal-footer.report-footer {
    border-top: 0px;
    width: 100%;
    margin-bottom: 14px;
}
.report-footer .print {
    width:48%;
    background: #795548;
    font-size: 16px;
    font-weight: 700;
    border: #795548;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.report-footer .close {
    width:48%;
    background: #FFc107;
    border: #FFC107;
    font-size: 16px;
    font-weight: 700;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
/*  */
.modal-header.modal-company-header {
    padding-bottom: 10px;
    border-bottom: 0px;
}
.modal-company-header h1 {
    font-weight: 600;
}
.login-div.setting-div {
    box-shadow: none;
    border-radius: 0px;
    padding: 0px;
}
.login-div .form-group {
    position: relative;
    margin-bottom: 0px;
}
.modal-body.modal-company-body {
    padding-top: 0px;
    padding-bottom: 0px;
}
.setting-div input#exampleInputEmail1 {
    border-radius: 10px;
    padding: 10px 10px;
    border: 1px solid #757575;
    margin-top: 5px;
    margin-bottom: 0px !important;
}
.login-div label.floating-label {
    display: flex;
    align-items: center;
}
.setting-div .floating-label {
    top: 23%;
}
.modal-body i.fas.fa-city {
    margin-right: 10px;
    color: #0064ff;
}
.modal-footer.add-company-footer {
    border-top: 0px;
}
.add-company-footer .Cancel-btn {
    font-weight: 600;
}
.add-company-footer .Create-btn {
    background: #FFC107;
    border: #FFC107;
    font-weight: 600;
}
/*  */

/* table-color */

td.two-r {
            background-color: #d58fd5; 
        }

        /* Background color for rows with the 'three-r' class */
        td.three-r {
            background-color: #b3b3ff; 
        }
td.two-rvv {
            background-color: #FFE494; 
        }

        
        td.three-rvv {
            background-color: #FFB2B2; 
        }


.custom-table {
            border-collapse: separate; /* This allows the border-radius to work */
            border-spacing: 0; /* Removes gaps between cells */
        }

        .custom-table th {
    text-align: center;
    padding: 5px;
    font-size: 18px;
    border: 2px solid orange;
    background-color: #f8f9fa;
}
        /* Add border-radius to the top-left and top-right corners */
        .custom-table th:first-child {
            border-top-left-radius: 10px;
        }

        .custom-table th:last-child {
            border-top-right-radius: 10px;
        }

        .custom-table td {
    text-align: center;
    padding: 5px;
    font-size: 16px;
    border: none;
    border-bottom: 2px solid #FFF;
    font-weight: normal !important;
}
        .custom-table th:nth-child(1) {
    border-right: 0px !important;
    font-weight: normal;
}
.custom-table th:nth-child(2) {
    border-left: 0px !important;
    font-weight: normal;
}
/*  */
.mobile-navbar {
    display: none;
}
.custom-table th {
    text-align: center !important;
}

.logout-btn::after{
    display: none;
}
@media(min-width: 240px) and (max-width: 479px) {
    .report-footer .print {
    width: 47%;
}
header.menu-head-sec {
    display: none;
}
.mobile-navbar {
    display: block;
}
.mobile-navbar .navbar-toggler span.navbar-toggler-icon:focus {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button.navbar-toggler:focus {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button.navbar-toggler {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button span.navbar-toggler-icon {
    opacity: 1 !important;
}
.logout-btn::after {
   display: none;
}
nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky !important;
}
}

@media(min-width: 320px) and (max-width: 374px){
    .report-footer .close {
    width: 47%;
}
}

@media(min-width: 480px) and (max-width: 767px) {
    .report-footer .print {
    width: 47%;
}

header.menu-head-sec {
    display: none;
}
.mobile-navbar {
    display: block;
}
.mobile-navbar .navbar-toggler span.navbar-toggler-icon:focus {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button.navbar-toggler:focus {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button.navbar-toggler {
    border: 0px !important;
    box-shadow: none !important;
}
.mobile-navbar button span.navbar-toggler-icon {
    opacity: 1 !important;
}
.logout-btn::after {
   display: none;
}
nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky !important;
}
}

@media(min-width: 768px) and (max-width: 999px) {

nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky !important;
}
}


tr.table-pink td {
    background: #dc9cd2 !important;
}

</style>
<body>
    <header class="menu-head-sec">
        <div class="container">
            <div class="row">
                <div class="col-sm-12">
                    <div class="fflx-img-txt">
                        <div class="navbar-sec">
                            <nav class="navbar navbar-dark bg-dark fixed-top back-new">
                                <div class="container-fluid">



                                  <a class="navbar-brand" href="{{ route('dashboard') }}"><img src="{{$logoUrl}}" height="50" width="50"><span class="head_company">mibook.dev</span></a>
                                  <div class="logout-btn">


                                    <a href="{{ route('company-info', ['companyID' => request()->query('companyID')]) }}" id="settling" >
                                    <div class="settling-pen">
                                        
                                            <i class='fas fa-pen'></i> Settling
                                        
                                    </div>
                                    </a>
                                    
                                    <div class="settling-report">
                                        <button type="button"id="report" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModalReport">
                                            <i class="fa fa-file"></i>Report
                                          </button>  
                                    </div>
@if($response['company']['access_level']=='full')

                                    <a href="{{ route('partners', ['companyID' => request()->query('companyID')]) }}" id="users">
                                    <div class="settling-users">
                                       

                                            <i class='fas fa-user-friends'></i> Users
                                       
                                    </div>
                                     </a>


@if(Auth::user()->is_admin)
                                <div class="gear-sett">
                                    <button type="button" class="btn btn-primary gear" data-bs-toggle="modal" data-bs-target="#com-setting">
                                        <i class="fa fa-gear"></i>
                                  </button>
                            </div>

@endif
                             @endif


                                </div>
                                </div>
                              </nav>
                        </div>
                </div>
            </div>
        </div>     
    </header>


<!-- mobile navbar -->

<div class="mobile-navbar">
     <nav class="navbar navbar-dark bg-dark fixed-top">
  <div class="container-fluid">
    <a class="navbar-brand" href="{{route('dashboard')}}"><img src="{{$logoUrl}}" height="25" width="25"><span class="head_company">mibook.dev</span></a>
    <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasDarkNavbar" aria-controls="offcanvasDarkNavbar" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasDarkNavbar" aria-labelledby="offcanvasDarkNavbarLabel">
      <div class="offcanvas-header">
         <a class="navbar-brand" href="{{ route('company-info', ['companyID' => request()->query('companyID')]) }}"><img src="{{$logoUrl}}" height="25" width="25"><span class="head_company">mibook.dev</span></a>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
       <div class="logout-btn">


                                    <a href="{{ route('company-info', ['companyID' => request()->query('companyID')]) }}" id="settling" >
                                    <div class="settling-pen">
                                        
                                            <i class='fas fa-pen'></i> Settling
                                        
                                    </div>
                                    </a>
                                    
                                    <div class="settling-report">
                                        <button type="button"id="report" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModalReport">
                                            <i class="fa fa-file"></i>Report
                                          </button>  
                                    </div>


                                    <a href="{{ route('partners', ['companyID' => request()->query('companyID')]) }}" id="users">
                                    <div class="settling-users">
                                       

                                            <i class='fas fa-user-friends'></i> Users
                                       
                                    </div>
                                     </a>

                                <div class="gear-sett">
                                    <button type="button" class="btn btn-primary gear" data-bs-toggle="modal" data-bs-target="#com-setting">
                                        <i class="fa fa-gear"></i>
                                  </button>
                            </div>
                                </div>
    </div>
  </div>
</nav>
</div>

<!-- end mobile navbar -->








    <!-- modal strt -->
    <div class="modal fade report-mod-full" id="exampleModalReport" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel"><span class="add_report_class"></span>Setting Report</h5>
              <h5 class="report-date">Date: {{date('d/m/y')}}</h5>
            </div>
            <div class="modal-body report-body">
              <div class="col-sm-6">
                <div class="report-data-tb">
                    <div class="table-responsive">
                    <table class="table custom-table table-bordered table-report-fst app-responsive-table app-responsive-table--compact">
                        <thead class="table custom-table">
                            <tr>
                                <th>Name</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                           
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="report-two-tb">
                    <div class="table-responsive">
                    <table class="table custom-table table-bordered table-report-snd app-responsive-table app-responsive-table--compact">
                        <thead class="table custom-table">
                            <tr>
                                <th>Name</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                           
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
            </div>
            <div class="modal-footer report-footer">
              <a href="{{ route('generateReportPDF', ['companyID' => request('companyID'), 'user_id' => Auth::user()->user_id]) }}" type="button" class="btn btn-primary print">Print</a>

              <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal">Close</button>
              
            </div>
          </div>
        </div>
      </div>

      <!-- modal end -->

        <!-- modal-strt company-setting -->
<div class="modal fade" id="com-setting" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header company-setting">
          <h1 class="modal-title fs-5" id="exampleModalLabel">Company Settings</h1>
        </div>
         <form id="editcompany">
            @csrf
        <div class="modal-body modal-company-body">
            <div class="login-div setting-div">
               
                    <div class="form-group">
                        <input type="hidden" name="company_id" value="{{$_GET['companyID']}}">
                        <input type="text" class="form-control" name="name" value="{{$response['company']['name']}}" id="exampleInputEmail1" placeholder="">
                        <label class="floating-label"  for="exampleInputEmail1"><i class='fas fa-city'></i>Edit Company Name</label>
                    </div>
                
            </div>
        </div>
        <div class="modal-footer add-company-footer">
          <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
@if($response['company']['access_level']=='full')

          <button type="submit" class="btn btn-primary Create-btn">Save Changes</button>

          @else

          <button type="submit" class="btn btn-primary Create-btn" disabled>Save Changes</button>


          @endif
        </div>

        </form>


      </div>
    </div>
  </div>
  <!--  -->

 @yield('content')

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
       


        $(document).ready(function() {
    // Get the current URL
    const currentUrl = window.location.href;

    // Remove active-tab from all elements initially
    $('.logout-btn a').removeClass('active-tab');

    // Check each link and apply active-tab class if the URL matches
    $('.logout-btn a').each(function() {
        const linkUrl = $(this).attr('href');

        // Check if the link URL matches the current browser URL
        if (currentUrl.includes(linkUrl)) {
            $(this).addClass('active-tab');
        }
    });
});




    </script>
<script>
$(document).ready(function () {
    // Get the companyID from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const companyID = urlParams.get('companyID');

    if (!companyID) {
        alert("Company ID is required.");
        return;
    }

    // Initialize DataTables without sorting
    const positiveTable = $('.table-report-fst').DataTable({
        ordering: false,
        searching: false,
        paging: false,
        info: false,
        columns: [
            { title: "Name" },
            { title: "Amount" }
        ]
    });

    const negativeTable = $('.table-report-snd').DataTable({
        ordering: false,
        searching: false,
        paging: false,
        info: false,
        columns: [
            { title: "Name" },
            { title: "Amount" }
        ]
    });

    // Function to fetch data and populate tables
    function loadData() {
        $.ajax({
            url: "{{ route('reports') }}",  // Replace with your actual endpoint
            method: 'GET',
            data: { companyID: companyID },
            success: function (response) {
                // Check if response is valid
                if (response.positive_balances && response.negative_balances) {
                    // Populate the positive balances table
                    positiveTable.clear();
                    response.positive_balances.forEach(item => {
                        const rowClass = item.partner_name === 'Total' ? 'table-primary' : 'table-pink'; // Different purple for 'Total'
                        positiveTable.row.add($('<tr class="' + rowClass + '">' +
                            '<td>' + item.partner_name + '</td>' +
                            '<td>' + Math.round(item.total_balance) + '</td>' +
                            '</tr>'));
                    });
                    positiveTable.draw();

                    // Populate the negative balances table
                    negativeTable.clear();
                    response.negative_balances.forEach(item => {
                        const rowClass = item.partner_name === 'Total' ? 'table-danger' : 'table-warning'; // Pink/red for 'Total'
                        negativeTable.row.add($('<tr class="' + rowClass + '">' +
                            '<td>' + item.partner_name + '</td>' +
                            '<td>' + Math.round(item.total_balance) + '</td>' +
                            '</tr>'));
                    });
                    negativeTable.draw();
                } else {
                    alert("Unexpected response format.");
                }
            },
            error: function (xhr, status, error) {
                console.error("AJAX error:", status, error);
               // alert("Error fetching data. Please try again.");
            }
        });
    }

    // Initial data load
    loadData();

    // Reload data every 5 seconds
    setInterval(loadData, 5000);
});
</script>

<script>
$(document).ready(function(){
 $('#report').on('click', function(e) {
 var companyName = $('.head_company').html();
  $('.add_report_class').html(companyName + ' ');
});
});
</script>


<script>
    $(document).ready(function() {
        $('#editcompany').on('submit', function(e) {
            e.preventDefault();
            
            $.ajax({
                url: "{{ route('updateCompany') }}",
                type: "POST",
                data: $(this).serialize(),
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: response.success,
                        }).then(() => {
                            // Optionally, close modal or refresh part of the page
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.error,
                        });
                    }

                    location.reload();
                },
                error: function(xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text:  xhr.responseJSON.message ,
                    });

                    location.reload();
                }
            });
        });
    });
</script>

      @yield('scripts')


<link rel="stylesheet" href="{{asset('css/company-theme.css')}}">
<script src="{{asset('js/form-navigation.js')}}"></script>
</body>
</html>
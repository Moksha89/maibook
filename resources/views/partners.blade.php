@extends('layouts.header_company')
@section('content')

<style type="text/css">

.report-mod-full .report-body .col-sm-4 {
    padding: 0px 10px;
}


#staticBackdrop button#report {
    width: 100% !important;
    background: #795548;
    border: 1px solid #795548 !important;
    margin: 0px !important;
}
#staticBackdrop i.fa.fa-file {
    margin-right: 5px;
}
.modal-body.report-body {
    height: auto !important;
    gap: 0% !important;
}
.report-footer .btn.btn-primary.print {
    width: 50% !important;
    border-radius: 5px 0px 0px 5px !important;
}
.report-footer .close {
    width: 50% !important;
    margin: 0px !important;
    border-radius: 0px 5px 5px 0px !important;
}


.navbar-sec a.navbar-brand {
    color: #000;
    font-size: 18px !important;
    font-weight: bold;
}
.btn.btn-primary.print {
    background: #795548;
    font-size: 16px;
    font-weight: 700;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    margin: 0px !important;
    border-radius: 5px !important;
    width: 100% !important;
    padding: 6px !important;
    border-color: transparent !important;
}
.data-table-new th {
    font-weight: bold !important;
}



	section.overview-sec {
    padding-top: 2%;
    padding-bottom: 1%;
    border-bottom: 2px solid #FF9800;
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
.add-company i.fa.fa-plus {
    font-size: 14px;
}
.modal-company .inactive-comp {
    background: #FFC107;
    border: transparent;
    border-radius: 50%;
    padding: 8px 10px;
}
.company-table .modal-body {
    width: 90%;
    margin: auto;
    padding: 0px;
}
.company-table .modal-header {
    border-bottom: 0px;
}
.remove-extra .col-sm-12.col-md-6 {
    display: none;
}
.header-row {
    background-color: #FFEEBB;
    font-weight: bold;
}
.remove-extra th {
    padding: 5px 5px !important;
    text-align: center !important;
}
.header-row th {
    padding: 10px;
    border: 1px solid #f0e1aa;
    font-size: 14px;
    font-weight: normal;
    text-align: center;
}
.remove-extra th:nth-child(1) {
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
}
.company-table tbody {
    text-align: center;
}
.company-table tbody tr {
    border-bottom: 1px solid #f9a203;
}
.company-table tbody th, td {
    padding: 15px 0px !important;
}
.remove-extra table#DataTables_Table_0 {
    margin: 0px !important;
    border: 2px solid orange;
    border-radius: 10px;
    width: 100%;
}
.company-table .col-sm-12.col-md-5 {
    display: none;
}
.company-table .col-sm-12.col-md-7 {
    display: none;
}
.modal-footer.company-table-footer {
    border-top: 0px;
    padding-bottom: 10px;
}
.company-table-footer button.btn.btn-secondary {
    background: #FFC107;
    width: 100%;
    border: #FFC107;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    margin: 0px !important;
}
.remove-after th::before {
display: none !important;
}
.remove-after th::after {
display: none !important;
}
.company-table i.fa.fa-check-circle {
    font-size: 18px;
    color: #FFF;
    background: #03be03;
    padding: 8px 8px;
    border-radius: 10px;
}
/*  */

/* table-css */
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
    padding: 8px 0px !important;
}
table#partners_table {
    border: 1px solid #00000040;
    border-radius: 5px !important;
}




.data-table-new th {
    background: #FEFBE8 !important;
    color: #000 !important;
    border: 0px !important;
    border-radius: 0px !important;
}
.data-table-new th::before {
display: none !important;
}
.data-table-new th::after {
display: none !important;
}
.settling-txt .one ul li:hover {
    background: #FFC107;
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
.data-table-new td {
    border-bottom: 1px solid #000 !important;
}
.data-table-new tr.odd td {
    background: #F9FAFC !important;
}
#partners_table td button {
    font-size: 12px !important;
    padding: 4px 10px!important;
}
section.add-user-sec {
    padding-top: 2%;
    padding-bottom: 2%;
}
.data-table-new .previous a.page-link {
    background: transparent !important;
    border: 0px;
}
.data-table-new .next a.page-link {
    background: transparent;
    border: 0px;
}
td.btn-action {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.btn-action .cross:active {
    background: #FF5722 !important;
}
.btn-action .gear:active{
    background: #FFC107 !important;
}
.modal-company .inactive-comp:active {
    background: #FFC107 !important;
}
.modal-company .add-company:active {
    background: #FFC107 !important;
}
/*  */

/* new-user model */

.modal-header.modal-company-header {
    padding-bottom: 10px;
    border-bottom: 0px;
}
.modal-company-header h1 {
    font-weight: 600;
}
.modal-company .login-div {
    padding: 0px;
}
.login-div {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    padding: 50px 25px;
    border-radius: 20px;
}
.modal-company .login-div .form-group {
    position: relative;
    margin-bottom: 0px;
}
.modal-company .login-div input#exampleInputEmail1 {
    border-radius: 5px;
    padding: 10px 15px;
    border: 1px solid #6f4e4e;
    margin-bottom: 0px;
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
.modal-body i.fas.fa-city {
    margin-right: 10px;
    color: #898989;
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
.mix-from {
    margin-top: 4%;
}
.login-div label.floating-label i.fas.fa-user-alt {
    color: #898989;
    margin-right: 5px;
    font-size: 16px;
}
.login-div label.floating-label {
    display: flex;
    align-items: center;
}
/*  */

/*  */

.login-div.setting-div {
    box-shadow: none;
    border-radius: 0px;
    padding: 0px;
}
.setting-div .form-group {
    margin-bottom: 0px;
}
.login-div .form-group {
    position: relative;
}
.setting-div input#exampleInputEmail1 {
    border-radius: 10px;
    padding: 10px 10px;
    border: 1px solid #757575;
    margin-top: 5px;
    margin-bottom: 0px !important;
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
.setting-div .floating-label {
    top: 23%;
}

.user-edit-new .modal-body.modal-company-body {
    padding-top: 0px;
    padding-bottom: 0px;
}
.inactive-mod-footer button.btn.btn-primary {
    background: #FF5722;
    border: #FF5722;
}
.modal-footer.inactive-mod-footer {
    border-top: 0px;
    padding-top: 0px;
}


.btn-action .gear {
    background: #FFC107 !important;
    border: #FFc107;
}
.btn-action .cross {
    background: #FF5722;
    border: #FF5722;
}

table#inactive_table {
    width: 100% !important;
}

table#partners_table {
    width: 100% !important;
}


#exampleModalReport .report-body .col-sm-6 {
    width: 50%;
    padding: 0px 10px !important;
}


.report-body #DataTables_Table_2 tr.odd td {
    background: #DC9CD2;
}
.report-body #DataTables_Table_2 tr.even td {
    background: #CFE2FF;
}

.report-body #DataTables_Table_3 tr.odd td {
    background: #FFF3CD;
}
.report-body #DataTables_Table_3 tr.even td {
    background: #F8D7DA;
}

.report-body #DataTables_Table_4 tr.odd td {
    background: #ffc10785;
}
.report-body #DataTables_Table_4 tr.even td {
    background: #795548c7;
}


.dt-bootstrap5 td {
    padding: 5px !important;
}


@media(min-width: 280px) and (max-width: 374px) {

.data-table-new #partners_table_wrapper .col-sm-12.col-md-6 {
    width: 100% !important;
}
div#partners_table_length {
    margin-bottom: 10px;
}
}


@media(min-width: 280px) and (max-width: 424px) {

.data-table-new .col-sm-12.col-md-5 {
    width: 100% !important;
    padding-bottom: 10px;
}
.data-table-new .col-sm-12.col-md-7 {
    width: 100% !important;
}
}


@media(min-width: 240px) and (max-width: 479px) {

.report-body .col-sm-6 {
    width: 100% !important;
}



.modal-body.report-body {
    display: block !important;
}
#exampleModalReport .report-body .col-sm-6 {
    width: 100%;
}
.report-mod-full .modal-header {
    flex-direction: column;
    row-gap: 15px;
}
h5#exampleModalLabel {
    font-size: 18px !important;
}
#partners_table_wrapper .col-sm-12.col-md-6 {
    width: 50% !important;
}
#partners_table_filter label {
    white-space: normal !important;
    display: flex;
    align-items: center;
}
#partners_table_filter input.form-control.form-control-sm {
    width: 100% !important;
}


.logout-btn {
    display: flex;
    flex-direction: column;
    padding: 0px 20px;
}
.logout-btn a {
    margin: auto;
    margin-left: 0px;
    color: #fff;
    padding: 5px 15px;
}
.settling-report {
    display: block;
    width: 100%;
    margin-left: 0;
    text-align: left;
}
.settling-report button.btn.btn-primary {
    color: #fff;
}
.logout-btn a {
    margin: auto;
    margin-left: 0px;
    color: #fff;
    padding: 5px 15px;
}
.gear-sett {
    width: fit-content;
    margin: auto;
    margin-left: 15px;
}
.navbar a.navbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
}
.data-table-new {
    overflow: hidden;
    overflow-x: scroll;
}
}



@media(min-width: 480px) and (max-width: 767px) {
.report-body .col-sm-6 {
    width: 100% !important;
}

.modal-body.report-body {
    display: block !important;
}
#exampleModalReport .report-body .col-sm-6 {
    width: 100%;
}
.report-mod-full .modal-header {
    flex-direction: column;
    row-gap: 15px;
}
h5#exampleModalLabel {
    font-size: 18px !important;
}
#partners_table_wrapper .col-sm-12.col-md-6 {
    width: 50% !important;
}
#partners_table_wrapper div.dataTables_wrapper div.dataTables_filter label {
    white-space: normal !important;
    display: flex;
    align-items: center;
}
#partners_table_wrapper div.dataTables_wrapper div.dataTables_filter input {
    width: 100% !important;
}




.logout-btn {
    display: flex;
    flex-direction: column;
    padding: 0px 20px;
}
.logout-btn a {
    margin: auto;
    margin-left: 0px;
    color: #fff;
    padding: 5px 15px;
}
.settling-report {
    display: block;
    width: 100%;
    margin-left: 0;
    text-align: left;
}
.settling-report button.btn.btn-primary {
    color: #fff;
}
.logout-btn a {
    margin: auto;
    margin-left: 0px;
    color: #fff;
    padding: 5px 15px;
}
.gear-sett {
    width: fit-content;
    margin: auto;
    margin-left: 15px;
}
.navbar a.navbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
}
.data-table-new {
    overflow: hidden;
    overflow-x: scroll;
}
}


/*  */
</style>


   <section class="overview-sec">
        <div class="container">
            <div class="row">

                <div class="col-sm-12">
                   
                    <div class="modal-company">

 @if(Auth::user()->is_admin || Auth::user()->is_manager || $response['company']['access_level']=='full')                         
<!-- Button trigger modal -->
<button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#exampleModal">
    <i class="fa fa-user-plus"></i> New User
  </button>
  @endif
  
  

<!-- Button trigger modal -->
<button type="button" class="btn btn-primary inactive-comp" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
    <i class='fas fa-user-alt-slash'></i>
  </button>
  
  <!-- strt Modal Inactive Companies -->
  <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog company-table">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">Inactive Users</h1>
        </div>
        <div class="modal-body remove-extra">
            <div class="table-responsive">
                <table id="inactive_table" class="app-responsive-table app-responsive-table--compact">
                    <thead class="remove-after">
                        <tr class="header-row">
                            <th>S/N</th>
            <th>User Name</th>
            <th>Balance</th>

           
            <th>Actions</th>

                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        
        </div>
        <div class="modal-footer company-table-footer">
          <button type="close" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
        <div class="modal-footer company-table-footer">
           <button type="button"id="report" class="btn btn-primary active_usr_btn" data-bs-toggle="modal" data-bs-target="#exampleModalReport_new">
                            <i class="fa fa-file"></i>Report
                                          </button> 
        </div>
      </div>
    </div>
  </div>
  <!-- end Modal Inactive Companies -->

 <!-- modal strt -->
    <div class="modal fade report-mod-full" id="exampleModalReport_new" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div data-whatsapp-capture>
              <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel"><span class="partner_add_report_class"></span>Total InActive Users</h5>
                <h5 class="report-date">Date: {{date('d/m/y')}}</h5>
              </div>
              <div class="modal-body report-body">
              <div class="col-sm-4">
                <div class="report-data-tb">
                    <div class="table-responsive">
                    <table class="table custom-table table-bordered new_table-report-fst app-responsive-table app-responsive-table--compact" data-whatsapp-label="Positive balances">
                        <thead class="table custom-table">
                            <tr>
                                <th>Inactive Users</th>
                                <th>Balance</th>
                               
                            </tr>
                        </thead>
                        <tbody>
                           
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="report-two-tb">
                    <div class="table-responsive">
                    <table class="table custom-table table-bordered new_table-report-snd app-responsive-table app-responsive-table--compact" data-whatsapp-label="Negative balances">
                        <thead class="table custom-table">
                            <tr>
                                <th>Inactive Users</th>
                                <th>Balance</th>
                                
                        </thead>
                        <tbody>
                           
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="report-two-tb">
                    <div class="table-responsive">
                    <table class="table custom-table table-bordered new_table-report-third app-responsive-table app-responsive-table--compact" data-whatsapp-label="Zero balances">
                        <thead class="table custom-table">
                            <tr>
                                <th>Inactive Users</th>
                                <th>Balance</th>
                                
                        </thead>
                        <tbody>
                           
                        </tbody>
                    </table>
                    </div>
                </div>
              </div>
              </div>
            </div>
            <div class="whatsapp-report-controls" data-whatsapp-report data-whatsapp-report-modal="#exampleModalReport_new" data-whatsapp-url="{{ route('whatsapp.send-report') }}">
              <div class="row g-2 align-items-end">
                <div class="col-md-5">
                  <label class="form-label" for="inactiveWhatsappReportPhone">WhatsApp number</label>
                  <input type="tel" id="inactiveWhatsappReportPhone" class="form-control" data-whatsapp-phone value="{{ Auth::user()->phone }}">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="inactiveWhatsappReportFormat">Format</label>
                  <select id="inactiveWhatsappReportFormat" class="form-select" data-whatsapp-format>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <button type="button" class="btn btn-success w-100" data-whatsapp-send>
                    <i class="fa fa-whatsapp"></i> Send
                  </button>
                </div>
              </div>
              <div class="small mt-2 d-none" data-whatsapp-feedback aria-live="polite"></div>
            </div>
            <div class="modal-footer report-footer">
              <a href="{{ route('ActivegenerateReportPDF', ['companyID' => request('companyID'), 'user_id' => Auth::user()->user_id]) }}" 
   type="button" class="btn btn-primary print">
   Print
</a>


              <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal">Close</button>
              
            </div>
          </div>
        </div>
      </div>

      <!-- modal end -->

  
 <!-- modal-strt new-company -->
  <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header">
          <h1 class="modal-title fs-5" id="exampleModalLabel">Create New User</h1>
        </div>

        <form id="create_partner">
    @csrf
    <div class="modal-body modal-company-body">
        <div class="login-div">
            <div class="form-group">
                <input type="text" class="form-control" id="partner_name" name="partner_name" placeholder="">
                <label class="floating-label" for="partner_name"><i class='fas fa-user-alt'></i>Enter User Name</label>
                <div class="text-danger" id="partner_name_error"></div>
            </div>
        </div>
        <div class="login-div mix-from">
            <div class="form-group">
                <input type="hidden" name="company_id" value="{{ $_GET['companyID'] }}">
                <input type="text" class="form-control" name="company_name" id="company_name" placeholder="" value="{{ $response['company']['name'] }}" disabled>
                <label class="floating-label" for="company_name"><i class='fas fa-city'></i>Enter Company Name</label>
                <div class="text-danger" id="company_name_error"></div>
            </div>
        </div>
    </div>
    <div class="modal-footer add-company-footer">
        <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-primary Create-btn" id="createUserButton">Create User</button>
    </div>
</form>


      </div>
    </div>
  </div>
                    </div>
                <!-- modal-strt new-company -->

                </div>

            </div>
        </div>
    </section>

    <section class="add-user-sec">
        <div class="container">
            <div class="row">
                <div class="col-sm-12">
                    <div class="data-table-new">
                        <div class="table-responsive">
                        <table id="partners_table" class="table table-striped table-bordered app-responsive-table">
    <thead>
        <tr>
            <th>S/N</th>
            <th>User Name</th>
            <th>Balance</th>

             @if($response['company']['access_level']=="full")
            <th>Actions</th>
             @endif
        </tr>
    </thead>
    <tbody>
        <!-- DataTables will handle this -->
    </tbody>
                        </table>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    </section>



    <!-- Modal inactive -->
<div class="modal fade inactive-mod" id="exampleModal1" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- <div class="modal-header">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div> -->

        <form id="inactive_form">
        	@csrf
        <div class="modal-body">
            <h1 class="modal-title fs-5" id="exampleModalLabel">Are you sure you want to make this user inactive</h1>
        </div>
        <div class="modal-footer inactive-mod-footer">
        	<input type="hidden" name="id" id="inactive_id">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Make Inactive</button>
        </div>
    </form>
      </div>
    </div>
  </div>
  <!--  -->


    <!-- modal-strt company-setting -->
<div class="modal fade user-edit-new" id="exampleModal2" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header company-setting">
          <h1 class="modal-title fs-5" id="exampleModalLabel">User Edit</h1>
        </div>

        <form id="edit_partner">
        	@csrf
        <div class="modal-body modal-company-body">
            <div class="login-div setting-div">
                
                    <div class="form-group">
                        <input type="hidden" name="id" class="form-control" id="edit_id" >
                        <input type="text" name="name" class="form-control" id="edit_name" placeholder="">
                        <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-city'></i>Edit User Name</label>
                    </div>
                
            </div>
        </div>
        <div class="modal-footer add-company-footer">
          <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary Create-btn">Save Changes</button>
        </div>

    </form>
      </div>
    </div>
  </div>
  <!--  -->

  

@endsection


@section('scripts')
@parent




<script type="text/javascript">
		$(document).ready(function() {
    // Assuming $response['company']['name'] is available in your script
    var companyName = "<?php echo $response['company']['name']; ?>";

    // Set the company name into the element with the class head_company
    $('.head_company').text(companyName);
});



$(document).ready(function() {
    loadTables();
});

let table;
let table2;

// function loadTables() {
//     const companyID = '{{ $_GET['companyID'] ?? null }}';
//     const Access="{{$response['company']['access_level']}}";

//     if (companyID) {
//         const ajaxConfig = {
//             url: "{{ route('company-info-ajax') }}",
//             type: 'GET',
//             data: { companyID: companyID }
//         };

//         if (!$.fn.DataTable.isDataTable('#partners_table')) {
//             table = $('#partners_table').DataTable({
//                 processing: true,
//                 serverSide: false,
//                 ajax: {
//                     ...ajaxConfig,
//                     dataSrc: function(json) {
//                         return json.company.active_partners || [];
//                     }
//                 },
//                 columns: [
//                     { data: 's_n', name: 's_n' },
//                     { data: 'name', name: 'name' },
//                     { data: 'balance', name: 'balance' },

//                    if(Access=='full'){


//                     {
//                         data: null,
//                         orderable: false,
//                         searchable: false,
//                         render: function(data, type, row) {
//                             return `
//                                 <button class="btn btn-warning editbtn" data-bs-toggle="modal" onclick="editt(this)" data-id="${row.id}" data-name="${row.name}" data-bs-target="#exampleModal2">
//                                     <i class="fas fa-pen"></i>
//                                 </button>
//                                 <button class="btn btn-danger inactivebtn" data-bs-toggle="modal" onclick="inactivebtn(this)" data-id="${row.id}" data-bs-target="#exampleModal1">
//                                     <i class="fas fa-user-alt-slash"></i>
//                                 </button>
//                             `;
//                         }
//                     }
//                         }
//                 ],
//                 order: [[0, 'asc']]
//             });
//         } else {
//             table.ajax.reload();
//         }

//         if (!$.fn.DataTable.isDataTable('#inactive_table')) {
//             table2 = $('#inactive_table').DataTable({
//                 processing: true,
//                 serverSide: false,
//                 ajax: {
//                     ...ajaxConfig,
//                     dataSrc: function(json) {
//                         return json.company.inactive_partners || [];
//                     }
//                 },
//                 columns: [
//                     { data: 's_n', name: 's_n' },
//                     { data: 'name', name: 'name' },
//                     { data: 'balance', name: 'balance' },
//                     {
//                         data: null,
//                         orderable: false,
//                         searchable: false,
//                         render: function(data, type, row) {
//                             return `<button class="activebtn" onclick="activebtn(this)" data-id="${row.id}">
//                                     <i class="fa fa-check-circle"></i>
//                                 </button>`;
//                         }
//                     }
//                 ],
//                 order: [[0, 'asc']]
//             });
//         } else {
//             table2.ajax.reload();
//         }
//     } else {
//         console.error('Company ID is missing.');
//     }
// }



function loadTables() {
    const companyID = '{{ $_GET['companyID'] ?? null }}';
    const Access = "{{$response['company']['access_level']}}";

    if (companyID) {
        const ajaxConfig = {
            url: "{{ route('company-info-ajax') }}",
            type: 'GET',
            data: { companyID: companyID }
        };

        if (!$.fn.DataTable.isDataTable('#partners_table')) {
            const partnerColumns = [
                { data: 's_n', name: 's_n' },
                { 
                    data: 'name', 
                    name: 'name',
                    render: function(data, type, row) {
                        return data.toUpperCase(); 
                    }
                },
                { 
                    data: 'balance', 
                    name: 'balance',
                    render: function(data, type, row) {
                        return Math.round(data); // Round off balance
                    }
                }
            ];

            // Conditionally add action buttons if access level is "full"
            if (Access === 'full') {
                partnerColumns.push({
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: function(data, type, row) {
                        return `
                            <button class="btn btn-warning editbtn" data-bs-toggle="modal" onclick="editt(this)" data-id="${row.id}" data-name="${row.name}" data-bs-target="#exampleModal2">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn btn-danger inactivebtn" data-bs-toggle="modal" onclick="inactivebtn(this)" data-id="${row.id}" data-bs-target="#exampleModal1">
                                <i class="fas fa-user-alt-slash"></i>
                            </button>
                        `;
                    }
                });
            }

            table = $('#partners_table').DataTable({
                processing: true,
                serverSide: false,
                ajax: {
                    ...ajaxConfig,
                    dataSrc: function(json) {
                        return json.company.active_partners || [];
                    }
                },
                columns: partnerColumns,
                order: [[0, 'asc']]
            });
        } else {
            table.ajax.reload();
        }

        if (!$.fn.DataTable.isDataTable('#inactive_table')) {
            const inactiveColumns = [
                { data: 's_n', name: 's_n' },
                { 
                    data: 'name', 
                    name: 'name',
                    render: function(data, type, row) {
                        const url = `{{ route('company-info-inactive') }}?companyID=${companyID}&partner_id=${row.id}`;
                        return `<a href="${url}" target="_blank">${data.toUpperCase()}</a>`;
                    }
                },
                { 
                    data: 'balance', 
                    name: 'balance',
                    render: function(data, type, row) {
                        return Math.round(data); // Round off balance
                    }
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: function(data, type, row) {
                        return `<button class="activebtn" onclick="activebtn(this)" data-id="${row.id}">
                                    <i class="fa fa-check-circle"></i>
                                </button>`;
                    }
                }
            ];

            table2 = $('#inactive_table').DataTable({
                processing: true,
                serverSide: false,
                ajax: {
                    ...ajaxConfig,
                    dataSrc: function(json) {
                        return json.company.inactive_partners || [];
                    }
                },
                columns: inactiveColumns,
                order: [[0, 'asc']]
            });
        } else {
            table2.ajax.reload();
        }
    } else {
        console.error('Company ID is missing.');
    }
}







$('#edit_partner').submit(function(e) {
    e.preventDefault();
    var formData = $(this).serialize();

    $.ajax({
        url: "{{ route('partners.update') }}",
        type: "POST",
        data: formData,
        success: function(response) {
            if (response.success) {
                Swal.fire("Success", response.success, "success");
                $('#exampleModal2').modal('hide');
                table.ajax.reload();
                table2.ajax.reload();
            } else {
                Swal.fire("Error", response.error, "error");
            }
        },
        error: function(xhr) {
            console.log(xhr);
            var errors = xhr.responseJSON.errors;
            if (errors) {
                Swal.fire("Validation error", Object.values(errors).join(', '), "error");
            } else {
                Swal.fire("Error", "Something went wrong. Please try again.", "error");
            }
        }
    });
});

$('#inactive_form').submit(function(e) {
    e.preventDefault();
    var formData = $(this).serialize();

    $.ajax({
        url: "{{ route('partners.inactive') }}",
        type: "POST",
        data: formData,
        success: function(response) {
            if (response.success) {
                Swal.fire("Success", response.success, "success");
                $('#exampleModal1').modal('hide');
                table.ajax.reload();
                table2.ajax.reload();
            } else {
                Swal.fire("Error", response.error, "error");
            }
        },
        error: function(xhr) {
            console.log(xhr);
            var errors = xhr.responseJSON.errors;
            if (errors) {
                Swal.fire("Validation error", Object.values(errors).join(', '), "error");
            } else {
                Swal.fire("Error", "Something went wrong. Please try again.", "error");
            }
        }
    });
});

function editt(element) {
    var id = $(element).data('id');
    var name = $(element).data('name');
    $('#edit_id').val(id);
    $('#edit_name').val(name);
}

function inactivebtn(element) {
    var id = $(element).data('id');
    $('#inactive_id').val(id);
}

function activebtn(element) {
    var id = $(element).data('id');

    $.ajax({
        url: "{{ route('partners.active') }}",
        type: "POST",
        data: {
            _token: '{{ csrf_token() }}',
            id: id
        },
        success: function(response) {
            if (response.success) {
                Swal.fire("Success", response.success, "success");
                table.ajax.reload();
                table2.ajax.reload();
            } else {
                Swal.fire("Error", response.error, "error");
            }
        },
        error: function(xhr) {
            console.log(xhr);
            var errors = xhr.responseJSON.errors;
            if (errors) {
                Swal.fire("Validation error", Object.values(errors).join(', '), "error");
            } else {
                Swal.fire("Error", "Something went wrong. Please try again.", "error");
            }
        }
    });
}

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
                table.ajax.reload();
                table2.ajax.reload();
            }
        },
        error: function(xhr) {
            console.log(xhr);
            $('#createUserButton').prop('disabled', false).text('Create User');
            if (xhr.status === 422) {
                let errors = xhr.responseJSON.errors;
                if (errors.partner_name) {
                    $('#partner_name_error').text(errors.partner_name[0]);
                }
                if (errors.company_id) {
                    $('#company_name_error').text(errors.company_id[0]);
                }
            } else {
                Swal.fire("Error", xhr.responseJSON.error || 'An error occurred. Please try again.', "error");
            }
        }
    });
});



</script>

<script>
$(document).ready(function () {
    // Get the companyID from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const companyID = urlParams.get('companyID');
    // alert(companyID);

    if (!companyID) {
        alert("Company ID is required.");
        return;
    }

    // Initialize DataTables without sorting
    const positiveTable = $('.new_table-report-fst').DataTable({
        ordering: false,
        searching: false,
        paging: false,
        info: false,
        columns: [
            { title: "Name" },
            { title: "Balance" },
        ]
    });

    const negativeTable = $('.new_table-report-snd').DataTable({
        ordering: false,
        searching: false,
        paging: false,
        info: false,
        columns: [
            { title: "Name" }, 
            { title: "Balance" },
        ]
    });

 const zeroTable = $('.new_table-report-third').DataTable({
        ordering: false,
        searching: false,
        paging: false,
        info: false,
        columns: [
            { title: "Name" },
            { title: "Balance" },
        ]
    });
    // Fetch data from an API or backend based on the companyID
    $.ajax({
        url: `/append_active_inactive_users/${companyID}`, // Replace with your API endpoint
        type: 'GET',
        success: function (data) {
            console.log(data);
            // Assuming data contains two arrays: positiveData and negativeData
            const positiveData = data.positive; // Positive data (example)
            const negativeData = data.negative; // Negative data (example)
            const zeroData = data.zero;
         


            // Populate positive table
            positiveData.forEach(item => {
                positiveTable.row.add([
                    item.partner_name, // Replace with actual data fields
                    item.total_balance,
                ]).draw();
            });

            // Populate negative table
            negativeData.forEach(item => {
                negativeTable.row.add([
                    item.partner_name, // Replace with actual data fields
                    item.total_balance,
                ]).draw();
            });

             zeroData.forEach(item => {
                zeroTable.row.add([
                    item.partner_name,
                    item.total_balance, // Replace with actual data fields
                ]).draw();
            });
        },
        error: function (err) {
            alert('Error fetching data');
            console.error(err);
        }
    });
});

</script>

<script>
$(document).ready(function(){
 $('.active_usr_btn').on('click', function(e) {
    // alert("hello");
 var companyName = $('.head_company').html();
  // alert(companyName);
  $('.partner_add_report_class').html(companyName + ' ');
});
});
</script>

@endsection
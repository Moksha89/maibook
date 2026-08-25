@extends('admin.layouts.admin')
@section('content')
<link rel="stylesheet" href="{{ asset('assets_admin/css/view-employee.css') }}">
<link rel="stylesheet" href="{{ asset('assets_admin/css/requests.css') }}">

<style>
    label.access-label {
        margin: 0px !important;
        cursor: pointer;
    } 
    .comp_full {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .comp_switch {
        display: flex;
        align-items: center;
        margin: 10px 0;
    }
    .comp_switch input[type="checkbox"] {
        display: none;
    }
    .comp_switch label {
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    .comp_switch .switch {
        position: relative;
        width: 40px;
        height: 20px;
        background-color: #ccc;
        border-radius: 20px;
        margin-right: 10px;
        transition: background-color 0.3s ease;
    }
    .comp_switch .switch::before {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background-color: #fff;
        border-radius: 50%;
        transition: transform 0.3s ease;
    }
    .comp_switch input[type="checkbox"]:checked + label .switch {
        background-color: #4caf50;
    }
    .comp_switch input[type="checkbox"]:checked + label .switch::before {
        transform: translateX(20px);
    }
    .phone_pass {
        display: flex;
        align-items: center;
        gap: 2%;
        margin-bottom: 20px;
    }
    div#companies-select {
        width: 50%;
    }
    div#tabs_select {
        width: 50%;
    }
    .phone_pass.role_pass {
        align-items: flex-start;
    }
    .user_show .slider.round {
      border-radius: 34px;
    }
    .user_show .slider.round:before {
      border-radius: 50%;
    }
    .user_show input:checked + .slider {
      background-color: #2196F3;
    }
    .user_show input:focus + .slider {
      box-shadow: 0 0 1px #2196F3;
    }
    .user_show input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(21px);
    }
    .user_show .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: .4s;
      transition: .4s;
    }
    .user_show .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 2px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    .user_show .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
        margin-bottom: 0px !important;
    }
    .user_show .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }
    .new-emp-btn {
        text-align: end;
    }
    .upload-sec .tab-sections {
        border: 2px solid #efefef;
        border-radius: 5px;
    }
    .upload-sec ul#myTab {
        background: #efefef;
        padding: 6px 4px;
    }
    .upload-sec button.nav-link {
        padding: 4px 25px !important;
    }
    .upload-sec .web-logo button:active {
        box-shadow: none !important;
        background: transparent !important;
        color: #000 !important;
    }
    .upload-sec .web-logo button:focus {
        box-shadow: none !important;
    }
    .upload-sec .change-pass button:active {
        box-shadow: none !important;
        background: transparent !important;
        color: #000 !important;
    }
    .upload-sec .change-pass button:focus {
        box-shadow: none !important;
    }
    button.btn.btn-primary.restore-company {
        margin-top: 0px;
        width: 15%;
    }
    section.upload-sec {
        padding-top: 2%;
        padding-bottom: 2%;
        padding-left: 25px;
        padding-right: 25px;
    }
    #profile-tab-pane .user_show p {
        margin: 0px;
        font-size: 16px;
    }
    #contact-tab-pane .user_show p {
        margin: 0px;
        font-size: 16px;
    }
    .uu a.btn.pen_icon {
        padding-top: 0px;
        padding-bottom: 0px;
    }
    #companies-select label {
        padding: 8px 15px 0px 15px;
    }
    div#companies-checkboxes {
        padding: 0px 15px;
    }
    #companies-checkboxes label {
        padding: 0px;
        margin: 0px !important;
        line-height: normal !important;
        font-size: 14px;
    }
    .userscroll::-webkit-scrollbar {
      width: 0px;
      background-color: #F5F5F5;
    }
    .radio-btn::-webkit-scrollbar {
      width: 0px;
      background-color: #F5F5F5;
    }
    .back-data .dropdown {
        width: 85%;
    }
    .ibook-sett-sec {
        padding-top: 2%;
        padding-bottom: 1%;
        border-bottom: 2px solid #ff6f01e6;
        padding-left: 25px;
        padding-right: 25px;
    }
    .basic-code h5 {
        text-align: center;
        margin-bottom: 4%;
        font-size: 18px;
    }
    .authentication-code h5 {
        text-align: center;
        font-size: 18px;
        margin-bottom: 4%;
    }
    .upload-sec .web-logo {
        margin-bottom: 2%;
    }
    .upload-sec .web-logo button {
        color: #000;
        width: 100%;
        padding: 8px 0px;
        text-align: start;
        font-size: 16px;
        background: #FFF;
        border: 1px solid #CED4DA;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        border-top: 0px;
        border-left: 0px;
        border-right: 0px;
        border-radius: 0px !important;
    }
    .upload-sec .web-logo i.fas.fa-file-upload {
        font-size: 22px;
        color: #FF9800;
    }
    .upload-sec .web-logo i.fa-solid.fa-heading {
        font-size: 22px;
        color: #FF9800;
    }
    .upload-sec .web-logo button:hover {
        background: transparent !important;
        color: #000;
    }
    .radio-btn {
        width: fit-content;
    }
    .userscroll {
        width: 100%;
        margin-top: 20px;
    }
    .userscroll .user_show {
        border-bottom: 1px solid #CDE4DA;
        border-radius: 0px !important;
    }
    .change-pass {
        width: 100%;
    }
    .upload-sec .change-pass button {
        color: #000;
        width: 100%;
        padding: 8px 0px;
        text-align: start;
        font-size: 16px;
        background: #FFF;
        border: 1px solid #CED4DA;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        border-top: 0px;
        border-left: 0px;
        border-right: 0px;
        border-radius: 0px !important;
    }
    .upload-sec .change-pass i {
        font-size: 22px;
        color: #FF9800;
    }
    .upload-sec .change-pass button:hover {
        background: transparent !important;
        color: #000;
    }
    .modal-header.modal-company-header {
        padding-bottom: 10px;
        border-bottom: 0px;
        margin-bottom: 15px;
    }
    .modal-company-header h1 {
        font-weight: 600;
    }
    .pass-module .login-div {
        padding: 0px;
    }
    .pass-module .login-div {
        padding: 0px;
        border-radius: 20px;
        width: 50%;
    }
    .pass-module .login-div .form-group {
        position: relative;
        margin-bottom: 0px;
    }
    .pass-module .login-div input#exampleInputEmail1 {
        padding: 10px 15px;
        border: 1px solid #6f4e4e;
        margin-bottom: 0px;
        border-radius: 10px;
    }
    .pass-module .login-div label.floating-label {
        display: flex;
        align-items: center;
    }
    .pass-module .floating-label {
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
    .pass-module .login-div label.floating-label i.fa.fa-lock {
        color: #898989;
        margin-right: 5px;
        font-size: 16px;
    }
    .pass-module .mix-from {
        margin-top: 4%;
    }
    .pass-module .add-company-footer button.btn.btn-primary.Create-btn {
        background: #FFC107;
        border: #FFC107;
    }
    .pass-module .modal-footer.add-company-footer {
        border-top: 0px;
    }
    .emp-code h5 {
        text-align: center;
        font-size: 18px;
    }
    .back-up h5 {
        text-align: center;
        font-size: 18px;
    }
    .new-emp-btn button {
        background: #FFC107 !important;
        border: #FFC107;
    }
    .new-emp-btn button:hover {
        background: #FFC107 !important;
    }
    .new-emp-btn button:active {
        background: #FFC107 !important;
    }
    section.employee-backup-sec {
        padding-top: 2%;
        padding-bottom: 2%;
    }
    .emp-add-mod .add-company-footer button {
        width: 100%;
    }
    .emp-add-mod.pass-module .mix-from {
        margin-top: 0%;
    }
    .emp-add-mod i {
        margin-right: 7px;
        font-size: 16px;
        color: #898989;
    }
    .employee-backup-sec .col-sm-6.backup-column {
        width: 51%;
    }
    .employee-backup-sec .col-sm-6.empolyee-column {
        width: 49%;
    }
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
    .modal-company .login-div {
        padding: 0px;
    }
    label.floating-label {
        font-size: 12px !important;
    }
    .floating-label {
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
    .nav-tabs .nav-link.active {
        color: #000;
        border-radius: 0px;
        border-bottom: 2px solid #FFC107;
    }
    .nav-tabs .nav-link {
        color: #999;
        border: 0px;
    }
    .nav-tabs {
        border-bottom: none;
    }
    .tab-content {
        padding: 15px;
        border-top: none;
        padding-left: 20px;
        padding-right: 20px;
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
        border: 0px;
        border-radius: 4px;
    }
    .row.grid-temp-row {
        margin-bottom: 2%;
    }
    li.nav-item.boder-right {
        border-right: 0px;
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
        border-radius: 0px 10px 0px 0px;
        border-left: 0px !important;
    }
    .table-viwe th {
        background: #FEFBE8 !important;
        color: #000 !important;
        border: 0px !important;
        border-radius: 0px !important;
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
    .table-viwe table.dataTable.table-striped>tbody>tr.odd>* {
        box-shadow: none !important;
        text-align: center !important;
    }
    .table-viwe td {
        border-bottom: 0px !important;
        padding: 6px 0px !important;
        text-align: center;
        border-top: 0px !important;
        box-shadow: none !important;
    }
    #list-view .modal-body {
        padding: 0px !important;
        border: 1px solid #00000029;
        border-radius: 5px;
        margin-top: 20px !important;
        height: 255px;
        overflow-y: scroll;
    }
    .table-striped tbody tr:nth-of-type(odd) {
        background-color: #F9FAFC !important;
    }
    .table-viwe .cross {
        background-color: transparent !important;
        border: #FF5722;
        padding: 0px;
    }
    .table-viwe i.fa.fa-times-circle {
        font-size: 18px;
    }
    .backup-table td {
        padding: 5px;
        font-size: 14px;
        text-align: center;
    }
    .btn-action .gear {
        background: transparent !important;
        border: #FFC107;
        padding: 0px;
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
    .remove-extra table#DataTables_Table_0 {
        margin: 0px !important;
        border: 2px solid orange;
        border-radius: 10px;
    }
    .remove-extra .col-sm-12.col-md-6 {
        display: none;
    }
    .remove-extra .col-sm-12.col-md-5 {
        display: none;
    }
    .remove-extra .col-sm-12.col-md-7 {
        display: none;
    }
    .remove-extra th {
        padding: 5px 5px;
        text-align: center !important;
    }
    .remove-after th::after {
        display: none !important;
    }
    .remove-after th::before {
        display: none !important;
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
    .restore-sec .back-data button.btn.btn-primary.add-company {
        background-color: #FFC107;
        border: #FFC107;
        padding: 4px 10px;
    }
    .restore-sec .back-data button.btn.btn-primary.add-company:active{
        background-color: #FFC107;
        border: #FFC107;
    }
    .restore-sec a.nav-link {
        font-size: 14px;
    }
    .New-backup button {
        background: #F97216;
        border: #F97216;
        padding: 4px 10px;
    }
    .New-backup button:active {
        background: #F97216 !important;
        border: #F97216;
    }
    .New-backup button:hover {
        background: #F97216;
        border: #F97216;
    }
    .new-backup-mod .modal-header.modal-company-header {
        padding: 5px;
    }
    .new-backup-mod h5 {
        font-size: 15px;
    }
    .new-backup-mod .modal-dialog {
        width: 30%;
    }
    .new-backup-mod button {
        padding: 4px 10px;
        font-size: 14px;
    }
    .rest-back .modal-dialog {
        width: 30%;
    }
    .rest-back h5 {
        font-size: 15px;
    }
    .rest-back button {
        padding: 4px 10px;
        font-size: 14px;
    }
    .new-backup-mod .add-company-footer .Create-btn {
        background: #FF9800;
        border: #FF9800;
        font-weight: 600;
    }
    .New-backup {
        display: flex;
        gap: 20px;
        align-items: center;
    }
    .upload-btn {
        background-color: #8B6E5E;
        color: white;
        border: none;
        padding: 4px 10px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
        margin-bottom: 0px;
    }
    .upload-btn input[type="file"] {
        display: none;
    }
    .upload-btn .icon {
        margin-right: 10px;
    }
    select#countries {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #6f4e4e;
        margin-bottom: 0px;
        border-radius: 10px;
        font-size: 12px;
    }
    .backup-table th {
        font-size: 14px;
        padding: 5px;
        font-weight: 400;
    }
    .cross i.fa.fa-download {
        color: #FF5722;
        font-size: 18px;
        margin-right: 10px;
    }
    .gear i.fa.fa-clock-o {
        color: orange;
        font-size: 18px;
    }
    h1#exampleModalLabel {
        font-size: 16px !important;
    }
    .back-data {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 4%;
        justify-content: space-between;
    }
    .dropdown-menu {
        max-height: 200px;
        overflow-y: auto;
        width: 100%;
    }
    .search-input {
        width: 100%;
        padding: 5px;
        margin-bottom: 5px;
    }
    .back-data button#dropdownMenuButton {
        background: #FAFAFA;
        color: #000;
        padding: 4px 10px;
    }
    .back-data .dropdown-item {
        padding: 7px;
    }
    .back-data button#dropdownMenuButton:focus {
        box-shadow: none !important;
    }
    .restore-sec .back-data button.btn.btn-primary.add-company:focus {
        box-shadow: none !important;
    }
    .New-backup button.btn.btn-primary.add-company:focus {
        box-shadow: none !important;
        background: #FF9800 !important;
    }
    .new-emp-btn button:focus {
        box-shadow: none !important;
    }
    .btn-action button:focus {
        box-shadow: none !important;
    }
    .backup-table .page-item.active .page-link {
        background: #FFC107;
        border: #FFC107;
        border-radius: 10px;
    }
    .backup-table .page-item.disabled .page-link {
        border: 0px;
    }
    .user_show button.btn.btn-primary.edit-company {
        background: transparent;
        border: none;
    }
    .uu i {
        color: #FF9800;
        font-size: 16px;
    }   
    .user_show i.fas.fa-pen {
        color: orange;
        font-size: 16px;
    }
    .uu button.btn.edit_emp {
        padding: 0px;
    }
    .uu button.btn.edit_emp:focus {
        box-shadow: none !important;
        border: 0px !important;
    }
    a.btn.pen_icon:focus {
        box-shadow: none !important;
        border: 0px !important;
    }
    .uu input[type="checkbox"] {
        margin-left: 10px;
    }
    #myTabContent {
        width: 100%;
    }
    .emp-add-mod .modal-dialog {
        width: 100% !important;
        max-width: 60%;
        margin: 0px auto !important;
        padding: 20px;
    }

    @media(min-width: 280px) and (max-width: 424px) {
        .upload-sec ul#myTab {
            flex-direction: column;
            gap: 10px;
        }
        .upload-sec button.nav-link {
            width: fit-content;
            margin: auto;
        }
        .comp_full {
            display: block !important;
        }
    }

    @media(min-width: 280px) and (max-width: 374px) {
        .restore-sec .container {
            padding: 0px !important;
        }
        .overview-tab-sec ul.nav.nav-tabs {
            flex-direction: column;
            margin-bottom: 20px;
        }
        .overview-tab-sec li.nav-item {
            width: 100% !important;
        }
    }

    @media(min-width: 240px) and (max-width: 479px) {
        .New-backup {
            flex-direction: column;
        }
        .new-backup-mod .modal-dialog {
            width: 100% !IMPORTANT;
        }
        select#backup_id {
            width: 100% !important;
        }
        .overview-tab-sec ul.nav.nav-tabs {
            margin-bottom: 20px;
        }
        .restore-sec .tab-content {
            padding: 0px !important;
        }
        .logout-btn a.set_btn {
            width: fit-content;
            text-align: center;
            margin-bottom: 20px;
            padding: 6px !important;
        }
        .logout-btn form a {
            width: fit-content;
            padding: 5px 15px !important;
            line-height: normal !important;
        }
        .modal-company {
            flex-direction: column;
        }
        .settling-sec .col-sm-4.search_col1 {
            width: 100% !important;
        }
        .emp-add-mod .modal-dialog {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0px auto !important;
            padding: 20px;
        }
        .phone_pass {
            gap: 0px !important;
            flex-direction: column;
            margin-bottom: 0px !important;
        }
        .pass-module .login-div {
            margin-bottom: 20px !important;
        }
        section.upload-sec {
            padding-left: 0px !important;
            padding-right: 0px !important;
        }
        div#tabs_select {
            width: 100%;
        }
        .pass-module .login-div {
            padding: 0px !important;
            width: 100% !important;
        }
        select#backup_id {
            width: fit-content;
        }
        .change-pass {
            width: 100%;
        }
        .ibook-sett-sec {
            padding-top: 5%;
            padding-bottom: 3%;
        }
        .employee-backup-sec .row {
            flex-direction: column;
            row-gap: 40px;
        }
        .upload-sec .row {
            row-gap: 40px;
        }
        .employee-backup-sec .col-sm-6.empolyee-column {
            width: 100%;
        }
        .employee-backup-sec .col-sm-6.backup-column {
            width: 100%;
        }
        .back-data .dropdown {
            width: 100%;
        }
        .back-data {
            margin-bottom: 4%;
            flex-direction: column;
        }
        button.btn.btn-primary.restore-company {
            width: fit-content;
            margin: auto;
            margin-left: 0px;
            margin-top: 10px;
        }
        .new-emp-btn {
            margin-bottom: 10px;
        }
        .mobile-navbar button.navbar-toggler {
            padding: 0px;
        }
        #myTabContent {
            width: 100%;
        }
    }

    @media(min-width: 480px) and (max-width: 767px) {
        .new-backup-mod .modal-dialog {
            width: 100% !IMPORTANT;
        }
        .upload-sec ul#myTab {
            gap: 8px;
        }
        .emp-add-mod .modal-dialog {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0px auto !important;
            padding: 20px;
        }
        .phone_pass {
            gap: 0px !important;
            flex-direction: column;
            margin-bottom: 0px !important;
        }
        .pass-module .login-div {
            margin-bottom: 20px !important;
        }
        section.upload-sec {
            padding-left: 10px !important;
            padding-right: 10px !important;
        }
        div#tabs_select {
            width: 100%;
        }
        .change-pass {
            width: 100%;
        }
        .pass-module .login-div {
            padding: 0px !important;
            width: 100% !important;
        }
        select#backup_id {
            width: fit-content;
        }
        .ibook-sett-sec {
            padding-top: 5%;
            padding-bottom: 3%;
        }
        .employee-backup-sec .row {
            flex-direction: column;
            row-gap: 40px;
        }
        .upload-sec .row {
            row-gap: 40px;
        }
        .employee-backup-sec .col-sm-6.empolyee-column {
            width: 100%;
        }
        .employee-backup-sec .col-sm-6.backup-column {
            width: 100%;
        }
        .back-data .dropdown {
            width: 100%;
        }
        .back-data {
            margin-bottom: 4%;
            flex-direction: column;
        }
        button.btn.btn-primary.restore-company {
            width: fit-content;
            margin: auto;
            margin-left: 0px;
            margin-top: 10px;
        }
        .new-emp-btn {
            margin-bottom: 10px;
        }
        .mobile-navbar button.navbar-toggler {
            padding: 0px;
        }
        #myTabContent {
            width: 100%;
        }
    }

    @media(min-width: 768px) and (max-width: 999px) {
        .comp_full {
            display: block !important;
        }
        .emp-add-mod .modal-dialog {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0px auto !important;
            padding: 20px;
        }
        .new-backup-mod .modal-dialog {
            width: 100% !IMPORTANT;
        }
        select#backup_id {
            width: fit-content;
            margin-bottom: 10px;
        }
        .pass-module .login-div {
            padding: 0px !important;
        }
        .back-data .dropdown {
            width: 100%;
        }
        .back-data {
            margin-bottom: 4%;
            flex-direction: column;
        }
        button.btn.btn-primary.restore-company {
            width: fit-content;
            margin: auto;
            margin-left: 0px;
        }
        .new-emp-btn {
            margin-bottom: 10px;
        }
        #myTabContent {
            width: 100%;
        }
    }

    @media(min-width: 1000px) and (max-width: 1100px) {
        .emp-add-mod .modal-dialog {
            max-width: 80% !important;
        }
    }
</style>

<style type="text/css">
    .switch-field {
        display: flex;
        margin-bottom: 36px;
        overflow: hidden;
    }
    .switch-field input {
        position: absolute !important;
        clip: rect(0, 0, 0, 0);
        height: 1px;
        width: 1px;
        border: 0;
        overflow: hidden;
    }
    .switch-field label {
        background-color: #e4e4e4;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
        line-height: 1;
        text-align: center;
        padding: 8px 16px !important;
        margin-right: -1px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px rgba(255, 255, 255, 0.1);
        transition: all 0.1s ease-in-out;
    }
    .switch-field label:hover {
        cursor: pointer;
    }
    .switch-field input:checked + label {
        background-color: #a5dc86;
        box-shadow: none;
    }
    .switch-field label:first-of-type {
        border-radius: 4px 0 0 4px;
    }
    .switch-field label:last-of-type {
        border-radius: 0 4px 4px 0;
    }
    .form {
        max-width: 600px;
        font-family: "Lucida Grande", Tahoma, Verdana, sans-serif;
        font-weight: normal;
        line-height: 1.625;
        margin: 8px auto;
        padding: 16px;
    }
    h2 {
        font-size: 18px;
        margin-bottom: 8px;
    }
    .flx_radio_key {
        display: flex;
        align-items: center !important;
        gap: 7px;
    }
    .flx_radio_key a.btn.pen_icon {
        padding: 6px 10px !important;
        background: #ffc107;
        line-height: 0 !important;
    }
    .flx_radio_key .pen_icon i.fas.fa-pen {
        font-size: 14px;
        line-height: normal !important;
        margin: 0px !important;
    }
    .flx_radio_key a.btn.delete-icon {
        background: #dc3545;
        padding: 6px 10px !important;
        line-height: 0px !important;
    }
    .flx_radio_key .delete-icon i.fa.fa-trash {
        font-size: 14px;
        line-height: normal !important;
        margin: 0px !important;
        color: #FFF;
    }
    .flx_radio_key .edit_emp i.fas.fa-key {
        font-size: 14px;
        line-height: normal !important;
        margin: 0px !important;
        color: #FFF;
    }
    button.btn.edit_emp {
        background: #008000;
        padding: 6px 10px !important;
        line-height: 0px !important;
    }
    .form-control:focus ~ .floating-label, .form-control:not(:placeholder-shown) ~ .floating-label {
         top: -10px !important; 
        left: 10px;
        font-size: 0.85rem;
        color: #706868;
    }
    #changepassModalemp .login-div {
        width: 100% !important; 
    }
</style>

<x-admin.table-page title="Users" button-text="New Employee" button-modal="creatuserModal" button-icon="">

    <!-- Change Password Modal -->
    <div class="modal fade pass-module" id="changepassModalemp" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header modal-company-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Change Password</h1>
                </div>
                <form method="post" action="{{ route('user.update_emp') }}" class="mt-6 space-y-6" id="updatePasswordForm">
                    @csrf
                    @method('post')
                    <div class="modal-body modal-company-body">
                        <input type="hidden" name="id" id="editemp_id">
                        <div class="login-div mix-from">
                            <div class="form-group">
                                <input id="password" name="password" type="password" class="form-control" placeholder="">
                                <label class="floating-label" for="password"><i class="fa fa-lock"></i> New Password</label>
                            </div>
                        </div>
                        <div class="login-div mix-from">
                            <div class="form-group">
                                <input id="password_confirmation" name="password_confirmation" type="password" class="form-control" placeholder="">
                                <label class="floating-label" for="password_confirmation"><i class="fa fa-lock"></i> Confirm Password</label>
                            </div>
                        </div>
                        <div id="passwordError" class="text-danger" style="display: none;">
                            Passwords do not match.
                        </div>
                    </div>
                    <div class="modal-footer add-company-footer">
                        <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary Create-btn">Continue</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="custom-tabs-container request-tab-all">
        <div class="table-responsive">
            <table id="example" class="table table-striped app-responsive-table" style="width:100%">
                <thead>
                    <tr>
                        <th>S/N</th>
                        <th>User Id</th>
                        <th>Name</th>
                        <th>User Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Country</th>
                        <th>Country Code</th>
                        <th>Otp Auth Enabled</th>
                        <th>Has Admin Priviledges</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Companies Acess</th>
                        <th>Employee Tab</th>
                        <th>Backup Tab</th>
                        <th>Is SuperAdmin</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <!-- Create User Modal -->
    <div class="modal fade pass-module emp-add-mod" id="creatuserModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header modal-company-header">
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Create New User</h1>
                </div>
                <form id="create_user" action="{{route('user.store')}}" method="post">
                    @csrf
                    <div class="modal-body modal-company-body">
                        <div class="phone_pass">
                            <div class="login-div">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="exampleInputEmail1" name="name" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-user-alt'></i>Name</label>
                                </div>
                            </div>
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="exampleInputEmail1" name="username" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-user-alt'></i>Username</label>
                                </div>
                            </div>
                        </div>
                        <div class="phone_pass">
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="exampleInputEmail1" name="phone" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-phone"></i>Phone</label>
                                </div>
                            </div>
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <input type="password" class="form-control" id="exampleInputEmail1" name="password" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-lock"></i>Password</label>
                                </div>
                            </div>
                        </div>
                        <div class="phone_pass">
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <select name="country_code" class="form-select">
                                        <option value="">Country Code</option>
                                        <option value="+93">Afghanistan (+93)</option>
                                        <option value="+355">Albania (+355)</option>
                                        <option value="+213">Algeria (+213)</option>
                                        <option value="+1-684">American Samoa (+1-684)</option>
                                        <option value="+376">Andorra (+376)</option>
                                        <option value="+244">Angola (+244)</option>
                                        <option value="+1-264">Anguilla (+1-264)</option>
                                        <option value="+672">Antarctica (+672)</option>
                                        <option value="+1-268">Antigua and Barbuda (+1-268)</option>
                                        <option value="+54">Argentina (+54)</option>
                                        <option value="+374">Armenia (+374)</option>
                                        <option value="+297">Aruba (+297)</option>
                                        <option value="+61">Australia (+61)</option>
                                        <option value="+43">Austria (+43)</option>
                                        <option value="+994">Azerbaijan (+994)</option>
                                        <option value="+1-242">Bahamas (+1-242)</option>
                                        <option value="+973">Bahrain (+973)</option>
                                        <option value="+880">Bangladesh (+880)</option>
                                        <option value="+1-246">Barbados (+1-246)</option>
                                        <option value="+375">Belarus (+375)</option>
                                        <option value="+32">Belgium (+32)</option>
                                        <option value="+501">Belize (+501)</option>
                                        <option value="+229">Benin (+229)</option>
                                        <option value="+1-441">Bermuda (+1-441)</option>
                                        <option value="+975">Bhutan (+975)</option>
                                        <option value="+591">Bolivia (+591)</option>
                                        <option value="+387">Bosnia and Herzegovina (+387)</option>
                                        <option value="+267">Botswana (+267)</option>
                                        <option value="+55">Brazil (+55)</option>
                                        <option value="+246">British Indian Ocean Territory (+246)</option>
                                        <option value="+1-284">British Virgin Islands (+1-284)</option>
                                        <option value="+673">Brunei (+673)</option>
                                        <option value="+359">Bulgaria (+359)</option>
                                        <option value="+226">Burkina Faso (+226)</option>
                                        <option value="+257">Burundi (+257)</option>
                                        <option value="+855">Cambodia (+855)</option>
                                        <option value="+237">Cameroon (+237)</option>
                                        <option value="+1">Canada (+1)</option>
                                        <option value="+238">Cape Verde (+238)</option>
                                        <option value="+1-345">Cayman Islands (+1-345)</option>
                                        <option value="+236">Central African Republic (+236)</option>
                                        <option value="+235">Chad (+235)</option>
                                        <option value="+56">Chile (+56)</option>
                                        <option value="+86">China (+86)</option>
                                        <option value="+61">Christmas Island (+61)</option>
                                        <option value="+61">Cocos Islands (+61)</option>
                                        <option value="+57">Colombia (+57)</option>
                                        <option value="+269">Comoros (+269)</option>
                                        <option value="+682">Cook Islands (+682)</option>
                                        <option value="+506">Costa Rica (+506)</option>
                                        <option value="+385">Croatia (+385)</option>
                                        <option value="+53">Cuba (+53)</option>
                                        <option value="+599">Curacao (+599)</option>
                                        <option value="+357">Cyprus (+357)</option>
                                        <option value="+420">Czech Republic (+420)</option>
                                        <option value="+243">Democratic Republic of the Congo (+243)</option>
                                        <option value="+45">Denmark (+45)</option>
                                        <option value="+253">Djibouti (+253)</option>
                                        <option value="+1-767">Dominica (+1-767)</option>
                                        <option value="+1-809">Dominican Republic (+1-809)</option>
                                        <option value="+670">East Timor (+670)</option>
                                        <option value="+593">Ecuador (+593)</option>
                                        <option value="+20">Egypt (+20)</option>
                                        <option value="+503">El Salvador (+503)</option>
                                        <option value="+240">Equatorial Guinea (+240)</option>
                                        <option value="+291">Eritrea (+291)</option>
                                        <option value="+372">Estonia (+372)</option>
                                        <option value="+251">Ethiopia (+251)</option>
                                        <option value="+500">Falkland Islands (+500)</option>
                                        <option value="+298">Faroe Islands (+298)</option>
                                        <option value="+679">Fiji (+679)</option>
                                        <option value="+358">Finland (+358)</option>
                                        <option value="+33">France (+33)</option>
                                        <option value="+689">French Polynesia (+689)</option>
                                        <option value="+241">Gabon (+241)</option>
                                        <option value="+220">Gambia (+220)</option>
                                        <option value="+995">Georgia (+995)</option>
                                        <option value="+49">Germany (+49)</option>
                                        <option value="+233">Ghana (+233)</option>
                                        <option value="+350">Gibraltar (+350)</option>
                                        <option value="+30">Greece (+30)</option>
                                        <option value="+299">Greenland (+299)</option>
                                        <option value="+1-473">Grenada (+1-473)</option>
                                        <option value="+1-671">Guam (+1-671)</option>
                                        <option value="+502">Guatemala (+502)</option>
                                        <option value="+44-1481">Guernsey (+44-1481)</option>
                                        <option value="+224">Guinea (+224)</option>
                                        <option value="+245">Guinea-Bissau (+245)</option>
                                        <option value="+592">Guyana (+592)</option>
                                        <option value="+509">Haiti (+509)</option>
                                        <option value="+504">Honduras (+504)</option>
                                        <option value="+852">Hong Kong (+852)</option>
                                        <option value="+36">Hungary (+36)</option>
                                        <option value="+354">Iceland (+354)</option>
                                        <option value="+91">India (+91)</option>
                                        <option value="+62">Indonesia (+62)</option>
                                        <option value="+98">Iran (+98)</option>
                                        <option value="+964">Iraq (+964)</option>
                                        <option value="+353">Ireland (+353)</option>
                                        <option value="+44-1624">Isle of Man (+44-1624)</option>
                                        <option value="+972">Israel (+972)</option>
                                        <option value="+39">Italy (+39)</option>
                                        <option value="+225">Ivory Coast (+225)</option>
                                        <option value="+1-876">Jamaica (+1-876)</option>
                                        <option value="+81">Japan (+81)</option>
                                        <option value="+44-1534">Jersey (+44-1534)</option>
                                        <option value="+962">Jordan (+962)</option>
                                        <option value="+7">Kazakhstan (+7)</option>
                                        <option value="+254">Kenya (+254)</option>
                                        <option value="+686">Kiribati (+686)</option>
                                        <option value="+383">Kosovo (+383)</option>
                                        <option value="+965">Kuwait (+965)</option>
                                        <option value="+996">Kyrgyzstan (+996)</option>
                                        <option value="+856">Laos (+856)</option>
                                        <option value="+371">Latvia (+371)</option>
                                        <option value="+961">Lebanon (+961)</option>
                                        <option value="+266">Lesotho (+266)</option>
                                        <option value="+231">Liberia (+231)</option>
                                        <option value="+218">Libya (+218)</option>
                                        <option value="+423">Liechtenstein (+423)</option>
                                        <option value="+370">Lithuania (+370)</option>
                                        <option value="+352">Luxembourg (+352)</option>
                                        <option value="+853">Macau (+853)</option>
                                        <option value="+389">North Macedonia (+389)</option>
                                        <option value="+261">Madagascar (+261)</option>
                                        <option value="+265">Malawi (+265)</option>
                                        <option value="+60">Malaysia (+60)</option>
                                        <option value="+960">Maldives (+960)</option>
                                        <option value="+223">Mali (+223)</option>
                                        <option value="+356">Malta (+356)</option>
                                        <option value="+692">Marshall Islands (+692)</option>
                                        <option value="+222">Mauritania (+222)</option>
                                        <option value="+230">Mauritius (+230)</option>
                                        <option value="+262">Mayotte (+262)</option>
                                        <option value="+52">Mexico (+52)</option>
                                        <option value="+691">Micronesia (+691)</option>
                                        <option value="+373">Moldova (+373)</option>
                                        <option value="+377">Monaco (+377)</option>
                                        <option value="+976">Mongolia (+976)</option>
                                        <option value="+382">Montenegro (+382)</option>
                                        <option value="+1-664">Montserrat (+1-664)</option>
                                        <option value="+212">Morocco (+212)</option>
                                        <option value="+258">Mozambique (+258)</option>
                                        <option value="+95">Myanmar (+95)</option>
                                        <option value="+264">Namibia (+264)</option>
                                        <option value="+674">Nauru (+674)</option>
                                        <option value="+977">Nepal (+977)</option>
                                        <option value="+31">Netherlands (+31)</option>
                                        <option value="+687">New Caledonia (+687)</option>
                                        <option value="+64">New Zealand (+64)</option>
                                        <option value="+505">Nicaragua (+505)</option>
                                        <option value="+227">Niger (+227)</option>
                                        <option value="+234">Nigeria (+234)</option>
                                        <option value="+683">Niue (+683)</option>
                                        <option value="+850">North Korea (+850)</option>
                                        <option value="+1-670">Northern Mariana Islands (+1-670)</option>
                                        <option value="+47">Norway (+47)</option>
                                        <option value="+968">Oman (+968)</option>
                                        <option value="+92">Pakistan (+92)</option>
                                        <option value="+680">Palau (+680)</option>
                                        <option value="+970">Palestine (+970)</option>
                                        <option value="+507">Panama (+507)</option>
                                        <option value="+675">Papua New Guinea (+675)</option>
                                        <option value="+595">Paraguay (+595)</option>
                                        <option value="+51">Peru (+51)</option>
                                        <option value="+63">Philippines (+63)</option>
                                        <option value="+48">Poland (+48)</option>
                                        <option value="+351">Portugal (+351)</option>
                                        <option value="+1-787">Puerto Rico (+1-787)</option>
                                        <option value="+974">Qatar (+974)</option>
                                        <option value="+242">Republic of the Congo (+242)</option>
                                        <option value="+40">Romania (+40)</option>
                                        <option value="+7">Russia (+7)</option>
                                        <option value="+250">Rwanda (+250)</option>
                                        <option value="+590">Saint Barthelemy (+590)</option>
                                        <option value="+290">Saint Helena (+290)</option>
                                        <option value="+1-869">Saint Kitts and Nevis (+1-869)</option>
                                        <option value="+1-758">Saint Lucia (+1-758)</option>
                                        <option value="+590">Saint Martin (+590)</option>
                                        <option value="+508">Saint Pierre and Miquelon (+508)</option>
                                        <option value="+1-784">Saint Vincent and the Grenadines (+1-784)</option>
                                        <option value="+685">Samoa (+685)</option>
                                        <option value="+378">San Marino (+378)</option>
                                        <option value="+239">Sao Tome and Principe (+239)</option>
                                        <option value="+966">Saudi Arabia (+966)</option>
                                        <option value="+221">Senegal (+221)</option>
                                        <option value="+381">Serbia (+381)</option>
                                        <option value="+248">Seychelles (+248)</option>
                                        <option value="+232">Sierra Leone (+232)</option>
                                        <option value="+65">Singapore (+65)</option>
                                        <option value="+1-721">Sint Maarten (+1-721)</option>
                                        <option value="+421">Slovakia (+421)</option>
                                        <option value="+386">Slovenia (+386)</option>
                                        <option value="+677">Solomon Islands (+677)</option>
                                        <option value="+252">Somalia (+252)</option>
                                        <option value="+27">South Africa (+27)</option>
                                        <option value="+82">South Korea (+82)</option>
                                        <option value="+211">South Sudan (+211)</option>
                                        <option value="+34">Spain (+34)</option>
                                        <option value="+94">Sri Lanka (+94)</option>
                                        <option value="+249">Sudan (+249)</option>
                                        <option value="+597">Suriname (+597)</option>
                                        <option value="+47">Svalbard and Jan Mayen (+47)</option>
                                        <option value="+268">Swaziland (+268)</option>
                                        <option value="+46">Sweden (+46)</option>
                                        <option value="+41">Switzerland (+41)</option>
                                        <option value="+963">Syria (+963)</option>
                                        <option value="+886">Taiwan (+886)</option>
                                        <option value="+992">Tajikistan (+992)</option>
                                        <option value="+255">Tanzania (+255)</option>
                                        <option value="+66">Thailand (+66)</option>
                                        <option value="+228">Togo (+228)</option>
                                        <option value="+690">Tokelau (+690)</option>
                                        <option value="+676">Tonga (+676)</option>
                                        <option value="+1-868">Trinidad and Tobago (+1-868)</option>
                                        <option value="+216">Tunisia (+216)</option>
                                        <option value="+90">Turkey (+90)</option>
                                        <option value="+993">Turkmenistan (+993)</option>
                                        <option value="+1-649">Turks and Caicos Islands (+1-649)</option>
                                        <option value="+688">Tuvalu (+688)</option>
                                        <option value="+256">Uganda (+256)</option>
                                        <option value="+380">Ukraine (+380)</option>
                                        <option value="+971">United Arab Emirates (+971)</option>
                                        <option value="+44">United Kingdom (+44)</option>
                                        <option value="+1">United States (+1)</option>
                                        <option value="+598">Uruguay (+598)</option>
                                        <option value="+998">Uzbekistan (+998)</option>
                                        <option value="+678">Vanuatu (+678)</option>
                                        <option value="+379">Vatican (+379)</option>
                                        <option value="+58">Venezuela (+58)</option>
                                        <option value="+84">Vietnam (+84)</option>
                                        <option value="+1-284">British Virgin Islands (+1-284)</option>
                                        <option value="+1-340">U.S. Virgin Islands (+1-340)</option>
                                        <option value="+681">Wallis and Futuna (+681)</option>
                                        <option value="+212">Western Sahara (+212)</option>
                                        <option value="+967">Yemen (+967)</option>
                                        <option value="+260">Zambia (+260)</option>
                                        <option value="+263">Zimbabwe (+263)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="exampleInputEmail1" name="email" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-envelope"></i>Email</label>
                                </div>
                            </div>
                        </div>
                        <div class="phone_pass">
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <select name="role" id="Role" onchange="showAccess(this.value)" class="form-select">
                                        @if(Auth::user()->is_superadmin && Auth::user()->is_admin)
                                            <option value="">Role</option>
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="employee">Employee</option>
                                        @elseif(Auth::user()->is_admin)
                                            <option value="">Role</option>
                                            <option value="manager">Manager</option>
                                            <option value="employee">Employee</option>
                                        @endif
                                        @if(Auth::user()->is_manager)
                                            <option value="">Role</option>
                                            <option value="employee">Employee</option>
                                        @endif
                                    </select>
                                </div>
                            </div>
                            <div class="login-div mix-from">
                                <div class="form-group">
                                    <input type="text" class="form-control" name="country" id="exampleInputEmail1" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-lock"></i>Country</label>
                                </div>
                            </div>
                        </div>
                        <div class="phone_pass role_pass">
                            <div class="form-group mb-3" style="display:none;" id="tabs_select">
                                <input type="checkbox" name="employee_tab" value="1" id="employee_tab" @if(isset($user) && $user->employee_tab == 1) checked @endif>
                                <label for="employee_tab">Employee Tab</label>
                                <input type="checkbox" name="backup_tab" value="1" id="backup_tab" @if(isset($user) && $user->backup_tab == 1) checked @endif>
                                <label for="backup_tab">Backup Tab</label>
                            </div>
                            <div class="login-div mix-from" id="companies-select" style="display: none;">
                                <div class="form-group">
                                    <label>Assign Companies with Access Level:</label>
                                    <div id="companies-checkboxes">
                                        @foreach($companies as $company)
                                            <div style="margin-bottom: 10px;">
                                                <input type="checkbox" name="companies_access[{{ $company->id }}][selected]" value="1" id="company_{{ $company->id }}" onchange="toggleAccessLevel({{ $company->id }})">
                                                <label for="company_{{ $company->id }}">{{ $company->name }}</label>
                                                <div id="access_options_{{ $company->id }}" style="display: inline-block; margin-left: 10px;">
                                                    <input type="radio" name="companies_access[{{ $company->id }}][access_level]" value="full" id="full_access_{{ $company->id }}">
                                                    <label for="full_access_{{ $company->id }}">Full Access</label>
                                                    <input type="radio" name="companies_access[{{ $company->id }}][access_level]" value="read" id="read_only_{{ $company->id }}">
                                                    <label for="read_only_{{ $company->id }}">Read-Only</label>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer add-company-footer">
                        <button type="submit" class="btn btn-primary Create-btn">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

</x-admin.table-page>

@endsection

@section('scripts')
@parent

<script type="text/javascript">
    var usersTable = initRealtimeTable('example', '/api/users', [
        { data: 'sn' },
        { data: 'user_id' },
        { data: 'name' },
        { data: 'username' },
        { data: 'phone' },
        { data: 'email' },
        { data: 'country' },
        { data: 'country_code' },
        { data: 'otp_auth_enabled' },
        { data: 'has_admin_priviledges' },
        { data: 'role' },
        { data: 'created_at' },
        { data: 'updated_at' },
        { data: 'companies_acess' },
        { data: 'employee_tab' },
        { data: 'backup_tab' },
        { data: 'is_superadmin' },
        {
            data: null,
            orderable: false,
            searchable: false,
            render: function(data, type, row) {
                var checked = row.otp_auth_enabled == 1 ? 'checked' : '';
                return '<div class="flx_radio_key">' +
                    '<div class="radio-btn"><div class="user_show"><div class="uu">' +
                    '<label class="switch"><input type="checkbox" name="otp_auth_enabled" ' + checked + ' onchange="toggleOtpAuth(this.checked,' + row.id + ')"><span class="slider round"></span></label>' +
                    '</div></div></div>' +
                    '<button type="button" class="btn edit_emp" data-bs-toggle="modal" data-id="' + row.id + '" data-bs-target="#changepassModalemp"><i class="fas fa-key"></i></button> ' +
                    '<a href="/user/' + row.id + '/edit" class="btn pen_icon"><i class="fas fa-pen"></i></a> ' +
                    '<a href="#" class="btn delete-icon" data-id="' + row.id + '"><i class="fa fa-trash"></i></a>' +
                    '</div>';
            }
        }
    ]);
</script>

<script>
    $(document).on('click', '.Create-btn_upload', function() {
        let formData = new FormData();
        formData.append('logo', $('input[name="logo"]')[0].files[0]);
        formData.append('_token', '{{ csrf_token() }}');
        $.ajax({
            url: "{{ route('upload.logo') }}",
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    Swal.fire("Success", "Logo uploaded successfully!", "success");
                    $('#logoPreview').attr('src', response.logo_url);
                    location.reload();
                } else {
                    Swal.fire("Error", response.error || "Failed to upload logo.", "error");
                }
            },
            error: function(xhr, status, error) {
                Swal.fire("Error", "An error occurred during upload.", "error");
                console.error(xhr.responseText);
            }
        });
    });

    $('#changepassModalemp').on('show.bs.modal', function(event) {
        var button = $(event.relatedTarget);
        var id = button.data('id');
        $('#editemp_id').val(id);
    });
</script>

<script>
    function toggleOtpAuth(isEnabled,id) {
        $.ajax({
            url: '{{ route("otp_auth") }}',
            type: 'POST',
            data: {
                otp_enabled: isEnabled ? 1 : 0,
                id: id,
                _token: '{{ csrf_token() }}'
            },
            success: function(response) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.message,
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: function(xhr) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while updating OTP authentication.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }
</script>

<script>
    $(document).on('click', '.delete-icon', function(event) {
        event.preventDefault();
        var userId = $(this).data('id');
        if (!userId) {
            Swal.fire('Error', 'User ID is missing.', 'error');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the user.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: "{{ route('user.delete', ':id') }}".replace(':id', userId),
                    type: 'DELETE',
                    data: {
                        _token: '{{ csrf_token() }}'
                    },
                    success: function(response) {
                        Swal.fire('Deleted!', 'The user has been deleted.', 'success');
                        location.reload();
                    },
                    error: function(xhr) {
                        Swal.fire('Error', 'Failed to delete the user.', 'error');
                    }
                });
            }
        });
    });
</script>

<script>
    function showAccess(role) {
        const companiesSelect = document.getElementById('companies-select');
        const tabs_select = document.getElementById('tabs_select');
        if (role === 'manager' || role === 'employee') {
            if(role === 'manager') {
                tabs_select.style.display = 'block';
            } else {
                tabs_select.style.display = 'none';
            }
            companiesSelect.style.display = 'block';
        } else {
            companiesSelect.style.display = 'none';
            tabs_select.style.display = 'none';
        }
    }

    function toggleAccessLevel(companyId) {
        const checkbox = document.getElementById(`company_${companyId}`);
        const accessOptions = document.querySelectorAll(`#access_options_${companyId} input[type="radio"]`);
        const fullAccessRadio = document.getElementById(`full_access_${companyId}`);
        accessOptions.forEach(radio => {
            radio.disabled = !checkbox.checked;
        });
        if (checkbox.checked) {
            fullAccessRadio.checked = true;
        } else {
            accessOptions.forEach(radio => radio.checked = false);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        @foreach($companies as $company)
            toggleAccessLevel({{ $company->id }});
        @endforeach
    });
</script>

@endsection

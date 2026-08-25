@extends('admin.layouts.admin')
@section('content')

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
    
    
    /* Wrapper for toggle switch */
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
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 3px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    
    .user_show .switch {
        position: relative;
        display: inline-block;
        width: 49px;
        height: 26px;
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
    
    /* menu-head-sec  css*/
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
    /*.userscroll {
        height: 200px;
        overflow-y: scroll;
    }*/
    .userscroll::-webkit-scrollbar {
      width: 0px;
      background-color: #F5F5F5;
    }
    .radio-btn::-webkit-scrollbar {
      width: 0px;
      background-color: #F5F5F5;
    }
    /*.radio-btn {
        height: 200px;
        overflow-y: scroll;
    }*/
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
        padding: 8px 10px;
        text-align: start;
        font-size: 16px;
        background: #FFF;
        border: 1px solid #CED4DA;
        /* box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px; */
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
    
    .upload-sec .web-logo i.fa.fa-heading {
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
        /* box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px; */
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
    /*  */
    
    /* model css */
    
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
     /* .pass-module .floating-label {
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
    } */
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
    /*  */
    
    
    
    /* employee css */
    .emp-code h5 {
        text-align: center;
        font-size: 18px;
    }
    .back-up h5 {
        text-align: center;
        font-size: 18px;
    }
    
    /* empmodel */
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
    /*  */
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
    /* .emp-add-mod .mix-from i.fa.fa-phone {
        rotate: 95deg;
    } */
    .emp-add-mod  i {
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
    
    /* backup-tab-css */
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
            /* end tab css */
    
    
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
    .restore-sec .back-data button.btn.btn-primary.add-company:hovre{
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
    /*  */
    
    
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
    
    .user_show {
        color: #000;
        width: 100%;
        padding: 5px 0px;
        text-align: start;
        font-size: 16px;
        background: #FFF;
        border: 0px solid #CED4DA;
        /* box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px; */
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 5px;
        margin-top: 0px;
        gap: 15px;
        margin-bottom: 10px;
    }
    
    .uu {
        font-size: 20px;
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
    
    /* This is just for CodePen. */
    
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
    </style>

<section class="ibook-sett-sec">
    <div class="container">
        <div class="row">
            <div class="col-sm-12">
                <div class="settings-ibook-txt">
                    <h2>Settings</h2>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="upload-sec">
    <div class="container">
        <div class="row">

<div class="col-sm">
    <div class="tab-sections">
        <ul class="nav nav-tabs" id="myTab" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">Basic</button>
  </li>

 

</ul>
<div class="tab-content" id="myTabContent">
  <div class="tab-pane fade show active" id="home-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabindex="0">
  @if(Auth::user()->is_superadmin)  

                    <div class="web-logo">
                        <button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#weblogoModal">
                            Change Website Logo<i class='fas fa-file-upload'></i>
                          </button>
                    </div>

                    <div class="web-logo">
                        <button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#changetitle">
                            Change Website Title<i class="fa fa-heading"></i>
                          </button>
                    </div>

                    @endif


  </div>
                  
</div>
    </div>
</div>
        </div>




<!-- change title modal -->
<div class="modal fade" id="changetitle" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header">
          <h1 class="modal-title fs-5" id="exampleModalLabel">Website Title</h1>
        </div>

<form id="Change_title">
@csrf
        <div class="modal-body modal-company-body">
            <input type="hidden" name="id" value="{{$website_title->id}}" >
           
            <div class="form-group">
                <label>Ttitle</label>
                <input type="text" name="title" class="form-control" value="{{$website_title->title}}">
            </div>
        </div>
        <div class="modal-footer add-company-footer">
          <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary Create-btn">Save</button>
        </div>

    </form>


      </div>
    </div>
  </div>
<!-- end -->



   <!-- modal-strt web logo -->
   <div class="modal fade" id="weblogoModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header modal-company-header">
          <h1 class="modal-title fs-5" id="exampleModalLabel">Upload New Logo</h1>
        </div>
        <div class="modal-body modal-company-body">
            <label class="upload-btn-logo">
                <span class="icon"><i class="fa fa-upload"></i></span>
                Upload Logo
                <input type="file" name="logo" />
            </label>
        </div>
        <div class="modal-footer add-company-footer">
          <button type="button" class="btn btn-secondary Cancel-btn" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary Create-btn_upload">Upload</button>
        </div>
      </div>
    </div>
  </div>
                    </div>
                <!-- modal-strt web-logo -->




            
                 
          

@endsection

@section('scripts')
@parent
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>


<script>


    $(document).on('click', '.Create-btn_upload', function() {
        let formData = new FormData();
        formData.append('logo', $('input[name="logo"]')[0].files[0]);
        formData.append('_token', '{{ csrf_token() }}'); // Add CSRF token
    
        $.ajax({
            url: "{{ route('upload.logo') }}", // Adjust route as necessary
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    Swal.fire("Success", "Logo uploaded successfully!", "success");
                    // $('#weblogoModal').modal('hide');
                    // Optionally, refresh the page or update the logo preview
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
            var button = $(event.relatedTarget); // Button that triggered the modal
    
            var id = button.data('id');
    
    $('#editemp_id').val(id);
    
    
    
        });
    
    
        </script>

        

<script>
    $(document).ready(function() {
        $('#Change_title').on('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission
    
            $.ajax({
                url: "{{ route('update.title') }}", // The route to your update function
                method: "POST",
                data: $(this).serialize(),
                success: function(response) {
    
                    console.log(response);
                    // if(response.success) {
    
                         Swal.fire("Success", "Title updated successfully!", "success");
                  location.reload();
                        // Optionally, update the UI or close the modal
                    // } else {
    
                    //       Swal.fire("Error", "Failed to update title.", "error");
                        
                    // }
                },
                error: function(xhr) {
                      Swal.fire("Error", "An error occurred", "error");
                
                    console.log(xhr.responseText);
                }
            });
        });
    
        
    });
    
</script> 



@endsection

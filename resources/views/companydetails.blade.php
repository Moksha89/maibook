@extends('layouts.header_company')
@section('content')
<style>
    button.togg_switc {
    display: none;
}
#transactionstable_wrapper tr.table-warning td {
    border: 0px solid #fff !important;
    border-bottom: 1px solid #0000002e !important;
}
#transactionstable .table-red td {
    background: #FF5722 !important;
}
#transactionstable_wrapper tr.table-danger.odd td {
    border: 0px solid #fff !important;
    border-bottom: 1px solid #0000002e !important;
}
input#Name_id_name {
    padding: 9px 10px !important;
}
input#remarks {
    padding: 9px 10px !important;
}
h5.report-date {
    margin: 0px;
    background: #FFEF89;
    padding: 6px 10px;
}
div#exampleModalReport {
    background: #F3F4F6;
}
.custom-table th {
    border: 0px !important;
    border-radius: 0px !important;
}
tr.table-pink td {
    background: #EEF6FF !important;
    border: 2px solid #fff !important;
}
tr.table-primary.even td {
    border: 2px solid #fff !important;
}

tr.table-warning td {
    border: 2px solid #fff !important;
}
tr.table-danger.odd td {
    border: 2px solid #fff !important;
}

.table th {
    width: auto !important;
}
.data-table-new table.dataTable {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
}
.data-table-new .table tbody::-webkit-scrollbar {
  width: 0px;   // for vertical scroll bar
  height: 0px;  // for horizontal scroll bar
}
ul#pagination {
    height: 25px;
}
.settling-txt::-webkit-scrollbar {
  width: 0px;   
  height: 0px; 
}
.data-table-new td{
    white-space: nowrap;
}
#pagination a.page-link {
    font-size: 10px;
    padding: 4px 10px;
}

.data-table-new #transactionstable {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 3px;
    border: 1px solid #0000002b;
    border-radius: 5px;
}

.data-table-new #transactionstable thead, #transactionstable tbody {
    display: block;
}

.data-table-new #transactionstable tbody {
    height: 300px;
    overflow-y: auto;
}

.data-table-new #transactionstable tbody tr {
    display: table;
    width: 100%;
    table-layout: fixed;
    border: 0px !important;
}

.data-table-new #transactionstable thead tr {
    display: table;
    width: 100%;
    table-layout: fixed;
    border: 0px !important;
    border-radius: 0px !important;
}




#remarks {
    width: 100%;
    padding: 10px 10px 5px 10px;
    font-size: 16px;
    border: 1px solid #ccc;
}


.login-div input {
    padding: 7px !important;
    border: 1px solid #00000024 !important;
    line-height: 20px !important;
    border-radius: 5px !important;
    font-size: 14px !important;
}


.form-group input:focus {
    box-shadow: none !important;
}

.input-container {
    position: relative;
    margin-top: 0px;
}

#suggestion-list2 li:last-child {
    border-bottom: 0px !important;
}
#suggestion-list2 li {
    border-bottom: 1px solid #00000026;
    margin-bottom: 0px;
    padding: 2px 10px;
    line-height: normal;
    font-size: 14px;
}
ul#suggestion-list2 {
    margin-top: 4px;
    border: 1px solid #00000026;
    border-radius: 4px;
    padding: 0px;
    margin-bottom: 0px !important;
}
#suggestion-list2 li:hover {
    background: #f8f9fa;
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
    position: sticky;
    top: 0px;
    z-index: 999;
}
.navbar-sec nav.navbar.navbar-dark.bg-dark.fixed-top.back-new {
    background: #FFF !important;
    position: sticky;
    padding: 5px 0px;
}
.navbar-sec a.navbar-brand {
     color: #000;
    font-size: 20px;
    display: flex;
    align-items: center;
    font-weight: bold;
}
.logout-btn i.fa.fa-gear {
    font-size: 20px;
    margin-right: 0px;
    color: #FFF;
}


.logout-btn {
    display: flex;
    align-items: center;
    position: relative;
    gap: 5px;
}
.logout-btn a {
    color: #000;
    text-decoration: none;
    font-weight: 600;
}
.logout-btn::after {
    content: '';
    border-left: 2px solid #000000e0;
    position: absolute;
    top: 5px;
    width: 100%;
    height: 70%;
    right: 30px;
    background-repeat: no-repeat;
}
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
}

    .menu-head-sec a:hover {
        background-color: #FFC107 !important;
        color: white;
    }


.custom-search-bar {
    background-color: #fff;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    position: relative;
    border: 1px solid #efefef !important;
    border-radius: 4px !important;
    margin-bottom: 10px;
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
        ul#suggestion-list {
    position: absolute;
    top: -1px;
    left: 12px;
    font-size: 12px;
}
        .entries {
    display: flex;
    justify-content: space-between;
}
.col-sm-8.settling-column {
    padding: 2% 1%;
    background: #F3F4F6;
}
.settling-sec .col-sm-4.search_col1 {
    width: 20%;
    margin-right: 0%;
    padding: 2% 1%;
}
.col-sm-8.settling-column {
    width: 80%;
}
.settling-txt .one ul {
    list-style: none;
    padding: 0px;
    text-align: center;
}
.settling-txt .one ul li {
    background: #fff;
    border-bottom: 0px solid #FFF;
    padding: 5px 5px;
    margin-bottom: 5px;
}
.settling-txt {
    height: 465px;
    overflow-y: scroll;
    border: 1px solid #00000042 !important;
    border-radius: 4px;
}
.settling-column .col-sm-12.col-md-6 {
    display: none;
}
.entries p {
    margin-bottom: 0px;
}
.entries p {
    margin-bottom: 0px;
    font-size: 14px;
    font-weight: 700;
    color: #2196F3;
}
.entries p.clossing {
    color: #000;
    font-weight: 400;
    margin-right: 33px;
}
.clossing span {
    font-weight: 700;
    color: #2196F3;
}
.data-table-new th {
    font-size: 12px;
    font-weight: normal;
    text-align: center !important;
}
.data-table-new td {
    text-align: center;
    font-size: 12px;
    box-shadow: none !important;
    border: 0px !important;
    border-bottom: 1px solid #00000036 !important;
}


.data-table-new th {
    background: #FFEEBB !important;
    color: #000 !important;
    border: 0px solid #FF9800 !important;
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

.data-table-new .col-sm-12.col-md-5 {
    width: 50%;
    padding-right: 0;
}
.data-table-new .col-sm-12.col-md-7 {
    width: 50%;
    padding-left: 0;
}

.data-table-new table#example {
    /* border: 1px solid #FF9800;
    border-bottom: 0px;
    margin-bottom: 0px !important;
    border-radius: 10px 10px 0px 0px; */
    margin-top: 0px !important;
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
.modal-body.report-body {
    display: flex;
    height: auto !important;
}
.report-body table {
    width: 100%;
    text-align: center;
    border: 1px solid #efefef !important;
    border-radius: 5px !important;
}
#exampleModalReport .modal-content {
    border: 0px !important;
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
    padding: 0px !important;
    margin: 0px !important;
}
.report-footer .print {
    background: #795548;
    font-size: 16px;
    font-weight: 700;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    margin: 0px !important;
    border-radius: 5px 0px 0px 5px !important;
    width: 50% !important;
    padding: 6px !important;
}
.report-footer .close {
    background: #FFc107;
    border: #FFC107;
    font-size: 16px;
    font-weight: 700;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    margin: 0px !important;
    border-radius: 0px 5px 5px 0px;
    width: 50% !important;
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
/*    width: fit-content;*/
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
    padding: 7px 7px;
    border: 1px solid #757575;
    margin-bottom: 0px !important;
    margin-top: 0px !important;
}
.login-div label.floating-label {
    display: flex;
    align-items: baseline;
    font-weight: 600;
}
.floating-label {
    position: absolute;
    left: 25px;
    top: 18%;
    transform: translateY(-5%);
    transition: all 0.2s ease;
    color: #666;
    pointer-events: none;
    background: #FFF;
    font-size: 16px;
    font-weight: 600;
    padding: 0px 2px;
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


/* button-botom */
.sec-btns {
    display: flex;
    align-items: center;
    gap: 25px;
    padding-top: 0%;
    padding-left: 10px;
    padding-right: 10px;
}
.buttons-creat button.btn.btn-primary {
    background: #607D8E;
    border: #607D8E;
    font-size: 12px;
    font-weight: 600;
}
.print-btn button {
    text-decoration: none;
    background: #795548;
    padding: 7px 20px;
    color: #FFF;
    font-size: 12px;
    font-weight: 600;
    border-radius: 5px;
    border: none;
}
.del-btn button {
    text-decoration: none;
    background: #FF5722;
    padding: 7px 20px;
    color: #FFF;
    font-size: 12px;
    font-weight: 600;
    border-radius: 5px;
    border: none;
}
.modify-btn button {
    text-decoration: none;
    background: #2196F3;
    padding: 7px 20px;
    color: #FFF;
    font-size: 12px;
    font-weight: 600;
    border-radius: 5px;
    border: none;
}
.text-sec-area form {
    display: flex;
    gap: 10px;
}
.text-sec-area {
    margin-top: 15px;
    margin-bottom: 3px;
    padding-right: 10px;
    padding-left: 10px;
}
.ok-btn button {
    background: #FFC107;
    border: #FFC107;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    color: #FFF;
    padding: 7px 15px;
    line-height: 20px;
}
.clear-btn button {
    background: #795548;
    border: #795548;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    color: #FFF;
    padding: 7px 15px;
    line-height: 20px;
}
.login-div.setting-div i {
    font-size: 14px;
    margin-right: 3px;
}
/* end */

/* model-report-entry */
.entry-mod .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid #FF9800;
    width: 95%;
    margin: auto;
    padding: 10px 0px;
}
.entry-mod h5 {
    color: #000;
    font-size: 18px;
    font-weight: 600;
}
.entry-mod .modal-body {
    display: flex;
    justify-content: space-between;
    padding: 10px 32px;
}
.entry-mod .modal-footer {
    padding: 0px;
    border-top: 0px;
    padding-bottom: 5%;
}
.entry-mod .modal-footer button {
    width: 80%;
    margin: auto;
    background: #FFc107;
    border: #FFC107;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    font-size: 18px;
    font-weight: 600;
}
.entry-mod p {
    font-size: 16px;
    font-weight: 400;
    color: #000;
    margin-bottom: 10px;
}
.entry-mod p span {
    font-size: 18px;
    font-weight: 500;
}
.entry-mod .blnc span {
    color: #2196F3;
}
.data-table-new {
    border: 0px solid #FF9800;
    border-radius: 10px;
}

.data-table-new div#example_info {
    margin-left: 10px;
}
/*  */




li.active-tab {
    background-color: #FFC107 !important;
  
}


#partners-list li {
    cursor: pointer;
    line-height: normal;
    font-size: 14px;
    border-bottom: 1px solid #0000002e;
}


tbody tr {
    cursor: pointer;
}

.active_row td {
    background: #287feafc !important;
    color: #fff;
}


.table-red.active_row td {
    background: #287feafc !important;
    color: #fff;
}


li.ui-menu-item {
    display: none;
}

.ui-helper-hidden-accessible {
    display: none;
}

@media(min-width: 240px) and (max-width: 479px) {
    button.togg_switc {
    display: block;
}
.search_hide_class {
    display: none;
}
.col-sm-4.search_col1.search_hide_class.main {
    display: block;
}
.settling-sec .col-sm-4.search_col1 {
    width: 100% !important;
}

    .entries {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
    
    .tab-respons-new .data-table-new {
    border: 1px solid #FF9800;
    border-radius: 10px;
    overflow: hidden;
    overflow-x: scroll;
    width: 100%;
}

    .settling-txt {
    height: auto;
}
.custom-search-bar {
    width: 100%;
}
    .data-table-new #transactionstable td {
    text-align: center;
    font-size: 12px;
    box-shadow: none !important;
    border: 0px;
    padding: 4px 8px !important;
    width: 60px;
    word-break: break-word;
}
.data-table-new td {
    white-space: normal;
}

    .login-div.setting-div {
    padding: 0px !important;
    margin-bottom: 20px;
}
.ok-btn {
    float: left;
    margin-bottom: 20px;
}
.clear-btn {
    float: right;
}
.clear-btn button {
    width: fit-content;
}
.autocomplete-wrapper {
    width: 100%;
}
.ok-btn button {
    width: fit-content;
}
.row.settling-row {
    flex-direction: column;
    row-gap: 20px;
}
.col-sm-8.settling-column {
    width: 100%;
}
.col-sm-4.search_col1 {
    width: 100%;
}
.setting_scroll {
    overflow: hidden;
}
.mobile-navbar nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky;
    top: 0px;
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
.sec-btns {
    gap: 17px;
    flex-wrap: wrap;
}
.text-sec-area form {
    display: block !important;
}
.modal-body.report-body {
    display: flex;
    height: auto;
    flex-direction: column;
    gap: 40px;
}
.report-body .col-sm-6 {
    width: 100%;
}
.entries p.clossing {
    margin-right: 0px !important;
}
.table th {
    width: 60px !important;
}

.custom-search-bar {
    margin-bottom: 0px !important;
}
}


@media(min-width: 480px) and (max-width: 767px) {
    button.togg_switc {
    display: block;
}
.search_hide_class {
    display: none;
}
.col-sm-4.search_col1.search_hide_class.main {
    display: block;
}
 
.custom-search-bar {
    margin-bottom: 0px !important;
}



    .entries {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
.entries p.clossing {
    margin-right: 0px !important;
}
    .tab-respons-new .data-table-new {
    border: 1px solid #FF9800;
    border-radius: 10px;
    overflow: hidden;
    overflow-x: scroll;
    width: 100%;
}
    .login-div.setting-div {
    padding: 0px !important;
    margin-bottom: 20px;
}
.ok-btn {
    float: left;
    margin-bottom: 20px;
}
.clear-btn {
    float: right;
}
.data-table-new #transactionstable td {
    text-align: center;
    font-size: 12px;
    box-shadow: none !important;
    border: 0px;
    padding: 4px 8px !important;
    width: 60px;
    word-break: break-word;
}
.data-table-new #transactionstable td {
    white-space: normal;
}
.ok-btn button {
    width: fit-content;
}
.clear-btn button {
    width: fit-content;
}
.autocomplete-wrapper {
    width: 100%;
}
.row.settling-row {
    flex-direction: column;
    row-gap: 20px;
}
.report-body .col-sm-6 {
    width: 100%;
}
.navbar a.navbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
}
.col-sm-8.settling-column {
    width: 100%;
}
.col-sm-4.search_col1 {
    width: 100%;
}
.settling-sec .col-sm-4.search_col1 {
    width: 100% !important;
}
.setting_scroll {
    overflow: hidden;
}
.mobile-navbar nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky;
    top: 0px;
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
.gear-sett {
    width: fit-content;
    margin: auto;
    margin-left: 15px;
}
.sec-btns {
    gap: 17px;
    flex-wrap: wrap;
}
.text-sec-area form {
    display: block !important;
}
.modal-body.report-body {
    display: flex;
    height: auto;
    flex-direction: column;
    gap: 40px;
}
.settling-txt {
    height: auto;
}
.custom-search-bar {
    width: 100%;
}
.table th {
    width: 60px !important;
}
}

@media(min-width: 768px) and (max-width: 999px) {

.data-table-new {
    overflow-x: scroll;
}
.table th {
    width: 60px !important;
}


    .settling-txt {
    height: 610px;
}
.ok-btn button {
    width: 100%;
}
.clear-btn button {
    width: 100%;
}
    .data-table-new #transactionstable td {
    text-align: center;
    font-size: 12px;
    box-shadow: none !important;
    border: 0px;
    padding: 4px 8px !important;
    width: 60px;
    word-break: break-word;
}
.data-table-new #transactionstable td {
    white-space: normal;
}
    .setting_scroll {
    overflow: hidden;
}
.text-sec-area form {
    display: grid;
    gap: 10px;
    grid-template-columns: 49% 49%;
}
.autocomplete-wrapper {
    width: 100% !important;
}
}


.highlight-no {
    color: blue;
    font-weight: bold;
}

.highlight-no {
    color: black;

}

#suggestion-list {

    color: blue;
}

#suggestion-list li {
    padding: 5px;
    cursor: pointer;
}


ul#suggestion-list2 {
    color: blue;
    list-style: none;
    cursor: pointer;
}


/* Style for the autocomplete wrapper */
.autocomplete-wrapper {
    position: relative;
    display: inline-block;
}

/* Style for the input field */
#Name_id_name {
    padding-right: 60px; /* Provide space for suggestion text */
    font-size: 16px;
}

/* Style for the search suggestion */
#search-suggestion {
    position: absolute;
    top: 49%;
    transform: translateY(-50%);
    left: calc(100% - 55px); /* Position close to the right side of the input */
    color: #fff;
   background: #0d6efd;

    font-size: 16px;
    white-space: nowrap;
    pointer-events: none; /* Prevent interaction */
}

/* Adjust spacing to ensure text flows naturally */
#Name_id_name, #search-suggestion {
    line-height: normal !important;
    font-family: Arial, sans-serif;
}


/* Container for the search bar */
.custom-search-bar {
    position: relative;
    display: inline-block;
    width: 100%;
}

/* Style for the input field */
#search-input {
       padding-right: 60px; /* Provide space for suggestion text */
    font-size: 16px;
}

/* Style for the search icon */
.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
}

/* Style for the suggestion text */
#search-suggestion_2 {
    position: absolute;
    top: 48%;
    transform: translateY(-50%);
    left: calc(100% - 55px); /* Position close to the right side of the input */
    color: #fff;
    background: #0d6efd;
    font-size: 16px;
    white-space: nowrap;
    pointer-events: none; /* Prevent interaction */
}






/* Style for the input field */
#remarks {
    padding-right: 60px; /* Provide space for suggestion text */
    font-size: 16px;
}

/* Style for the search suggestion */
#search-suggestion3 {
    position: absolute;
    top: 48%;
    transform: translateY(-50%);
    left: calc(100% - 55px); /* Position close to the right side of the input */
     color: #fff;
    background: #0d6efd;
    font-size: 16px;
    white-space: nowrap;
    pointer-events: none; /* Prevent interaction */
}

/* Adjust spacing to ensure text flows naturally */
#remarks, #search-suggestion3 {
    line-height: normal !important;
    font-family: Arial, sans-serif;
}


/* Container for the search bar */
.custom-search-bar {
    position: relative;
    display: inline-block;
    width: 100%;
}

/* Style for the input field */
#search-input {
       padding-right: 60px; /* Provide space for suggestion text */
    font-size: 16px;
}

/* Style for the search icon */
.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
}





a.page-link {
    font-size: 12px !important;
    /* padding: 8px; */

}

div#transactionstable_info {
    font-size: 13px !important;
    margin: 0px 5px;
    padding-top: 5px 0px 0px 0px !important;
}
div#transactionstable_paginate {
    padding: 5px 0px 0px 0px;
    margin: 0px 5px;
}
.pagination .page-item a.page-link {
    border-radius: 0px !important;
    padding: 5px !important;
    line-height: normal !important;
    font-size: 14px !important;
}


/* Wrapper for the input and label */
.input-container {
    position: relative;
    width: 100%;
}

/* Styling for the input field */
input.form-control {
    width: 100%;
    padding: 12px 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;
}

/* Remove native placeholder styles */
input.form-control::placeholder {
    color: transparent;
}

/* Styling for the floating label */
.floating-label {
    position: absolute;
    top: 50%;
    left: 8px;
    transform: translateY(-50%);
    font-size: 16px;
    color: #333;
    transition: all 0.3s ease;
    pointer-events: none;
    font-weight: 400 !important;
}

/* Float label up when input is focused or has a value */
input.form-control:focus + .floating-label,
input.form-control:not(:placeholder-shown) + .floating-label {
    top: -3px;
    font-size: 12px;
}
.setting-div .floating-label {
    top: 46%;
}

</style>
    <section class="settling-sec">
        <div class="container">
            <div class="row settling-row">
            <button class="togg_switc"><i class="fa fa-bars"></i></button>
                <div id="search_hide_show" class="col-sm-4 search_col1 search_hide_class">
                    <!-- <div class="settling-txt">
                        <div class="custom-search-bar">
                            <span class="search-icon">&#128269;</span>
                            <input type="text" id="search-input" placeholder="Search...">

                        </div>


                        <div class="one">
                            <ul id="partners-list">

                                @foreach($response['company']['active_partners'] as $users)
                                <li data-partner_id="{{$users->id}}" data-user_id="{{Auth::user()->user_id}}" data-balance="{{$users->balance}}" data-name="{{$users->name}}">{{$users->name}}</li>

                                @endforeach
                                
                                
                            </ul>
                        </div>
                    </div> -->
<div class="settling-txt">
    <div class="custom-search-bar">
        <!-- <span class="search-icon">&#128269;</span> -->



       <!--  <input type="text" id="search-input" placeholder="Search...">
       
 -->


  <ul id="suggestion-list" style="display:none;"></ul>
  
        <input type="text" id="search-input" placeholder="&#xF002; Search" style="font-family:Arial, FontAwesome;text-transform: uppercase;" >

        <span id="search-suggestion_2" class="search-suggestion2"></span>
   


    <!-- <div id="autocomplete-list" class="autocomplete-list"></div> -->




    </div>

    <div class="one">
        <ul id="partners-list">
            @foreach($response['company']['active_partners'] as $users)
                <li data-partner_id="{{$users->id}}" data-user_id="{{Auth::user()->user_id}}" data-balance="{{$users->balance}}" data-name="{{$users->name}}">{{strtoupper($users->name)}}</li>
            @endforeach
        </ul>
    </div>
</div>


                </div>


                <div class="col-sm-8 settling-column">
                    <div class="setting_scroll tab-respons-new">
                    <div class="entries">
                        <p><span class="active_user">
                    </span>  Entries</p>
                        <p class="clossing" >Closing Balance:<span id="closing_bal"> 0</span></p>
                    </div>  
                    <div class="data-table-new">
                        <div class="table-responsive">
<table id="transactionstable" class="table table-striped table-bordered app-responsive-table">
    <thead>
        <tr>
            <th>S/N</th>
            <th>Date</th>
            <th>Name</th>
            <th>Remarks</th>
            <th>Coins</th>
            <th>Rate</th>
            <th>Credit</th>
            <th>Debit</th>
            <th>Balance</th>
        </tr>
    </thead>
    <tbody>
        <!-- Rows will be appended here -->
    </tbody>
</table>
                        </div>
<ul id="pagination" class="pagination">
    <!-- Pagination will be generated here -->
</ul>


<div class="sec-actions" style="display:none;">
                    <div class="sec-btns" >
                          <div class="buttons-creat">
                            <button type="button" onclick="get_report()" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#reportmodify">
                              Report
                              </button>
                        </div>
                        <div class="print-btn">
                            <button>Print</button>
                        </div>
                        <div class="del-btn">
                           <button type="button" onclick="get_delete()">Delete</button>
                        </div>
                        <div class="modify-btn">
                            <button type="button" onclick="get_modify()">Modify</button>
                        </div>
                    </div>

                    <div class="text-sec-area">
                        <form id="register_entry">
                        <div class="login-div setting-div">
                            

                            <input type="hidden" name="transaction_id" id="transaction_id">

                                <div class="form-group">
                                    <input type="text" class="form-control" id="Balance_put" placeholder="" readonly>
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-dollar"></i>Balance</label>
                                </div>
                           
                        </div>
                        <div class="login-div setting-div nam_flt">
                            
                                <div class="form-group">
                                 <!-- <input type="text" class="form-control" id="Name_id_name" placeholder="" onkeyup="getbal(this.value)"> -->



    <div class="autocomplete-wrapper">

<div class="input-container">
    <input type="text" id="Name_id_name" class="form-control" style="text-transform: uppercase;" placeholder=" " />
    <label class="floating-label" for="Name_id_name"><i class="fas fa-shield-alt"></i> Name</label>
</div>


        <!-- <input type="text" id="Name_id_name" class="Name_id_name form-control" > -->
                                    <!-- <label class="floating-label nam_float" for="exampleInputEmail1"><i class="fas fa-shield-alt"></i>Name</label> -->
        <span id="search-suggestion" class="search-suggestion"></span>
    </div>
    <div id="autocomplete-list" class="autocomplete-list" style="display:none;"></div>





                                 <span id="error" style="color: red;"></span>

                                 <input type="hidden" name="product_id" id="product_id">
                                 <input type="hidden" name="name_id" id="name_id">

                                </div>
                           
                        </div>


                        <div class="login-div setting-div">
                           
                                <div class="form-group">
                                    <input type="text" class="form-control" name="coins" id="coins" placeholder="">
                                    <label class="floating-label"  for="exampleInputEmail1"><i class='fas fa-city'></i>Coins</label>
                                </div>
                            
                        </div>
                        <div class="login-div setting-div">
                           
                                <div class="form-group">
                                    <input type="text" class="form-control" name="rate" id="exampleInputEmail1" placeholder="">
                                    <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-percent"></i>Rate</label>
                                </div>
                            
                        </div>
                        <div class="login-div setting-div remk_flot">
                           
                                <!-- <div class="form-group">

    <div class="autocomplete-wrapper">

        <div class="input-container float_input">
        <input type="text" class="form-control " name="remarks" id="remarks" >
        <label class="floating-label" for="remarks"><i class="fa fa-check"></i>Remarks</label>
        </div>

        <span id="search-suggestion3" class="search-suggestion3"></span>
    </div>

    <div id="autocomplete-list3" class="autocomplete-list3" style="display:none;">
    </div>

    </div> -->


    <div class="form-group">
    <div class="autocomplete-wrapper">
        <div class="input-container float_input">
            <!-- Placeholder is required for the CSS effect -->
            <input 
                type="text" 
                class="form-control" 
                name="remarks" 
                id="remarks" 
                placeholder="Remarks"
            style="text-transform: uppercase;"
            >
            <label class="floating-label" for="remarks">
                <i class="fa fa-check"></i> Remarks
            </label>
        </div>
        <span id="search-suggestion3" class="search-suggestion3"></span>
    </div>
    <div id="autocomplete-list3" class="autocomplete-list3" style="display:none;"></div>
</div>
                            
                        </div>

                        <div class="ok-btn">
                            <button id="submittransaction" type="submit">OK</button>
                        </div>
                        <div class="clear-btn">
                            <button type="button" onclick="$('#register_entry')[0].reset();">Clear</button>
                        </div>
                    </form>
                    </div>

</div>




                    </div>
                </div>

                </div>
            </div>
        </div>

    </section>
<!-- Modal -->
<div class="modal fade entry-mod" id="reportmodify" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Report Entry</h5>
        <h5>Current Date: {{date('d/m/y')}}</h5>
        </div>
        <div class="modal-body">
          <p>User Name:<span id="report_user">BANK</span></p>
          <p class="blnc">Closing Balance:<span id="report_balance">12000</span></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

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





</script>


<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>

<script>


$(document).ready(function() {
    // Attach a keydown event to all input fields in the form
    $('#register_entry input').on('keydown', function(event) {
        if (event.key === 'Enter') { // Check if the pressed key is Enter
            event.preventDefault(); // Prevent the default form submission

            // Get all input fields in the form
            let inputs = $('#register_entry input');
            // Find the index of the current input field
            let currentIndex = inputs.index(this);

            // Get the next input field using the current index
            let nextInput = inputs.eq(currentIndex + 1);
console.log(nextInput);
            // Check if there is a next input field
            if (nextInput.length>0) {
                nextInput.focus(); // Move focus to the next input field
            } else {
                // If there is no next input field, submit the form
                $('#submittransaction').click();
            }
        }
    });
});






$(document).ready(function() {
    $('#search-input').on('input', function() {
        var searchTerm = $(this).val().toLowerCase();


        // Filter and highlight the list items
        $('#partners-list li').each(function() {
            var listItem = $(this);
            var listItemText = listItem.text().toLowerCase();

            if (listItemText.indexOf(searchTerm) !== -1) {
                listItem.show();


console.log(listItem);
// if (listItemText === searchTerm) {

//                     $(this).click(); // Trigger click event on the matched list item

                    
//                 }

                // Highlight the matched portion in the list item
                // listItem.html(listItemText.replace(new RegExp(searchTerm, 'gi'), '<span class="highlight">$&</span>'));
                return false; // Break the loop after finding the first match
            }
        });


if (searchTerm.length > 0) {
    // Get the first visible suggestion
    var firstSuggestion = $('#partners-list li:visible:first').text();

    // Highlight the matched text
    var highlightedSuggestion = firstSuggestion.replace(new RegExp(searchTerm, 'gi'), '<span class="highlight-no">$&</span>');

    // Update the suggestion list
    $('#suggestion-list').html(highlightedSuggestion);
} else {
    // Clear the suggestion list if the search term is empty
    $('#suggestion-list').empty();
}
       
    });



 // Handle click on suggestion list items
        $('#suggestion-list').click(function() {
            var selectedSuggestion = $(this).text();
            $('#search-input').val(selectedSuggestion);
            $('#suggestion-list').empty(); // Clear the suggestion list after selection
        });

    // Handle Enter key press
    $('#search-input').keypress(function(event) {
        if (event.which == 13) {
            var firstSuggestion = $('#suggestion-list').text();
            // alert(firstSuggestion);
            $('#search-input').val(firstSuggestion);
            $('#suggestion-list').empty(); // Clear the suggestion list after selection
        }
    });



});










$(document).ready(function() {
    // Array to hold the names for autocomplete
    let partnersArray = [];

    // Populate the array with partner names from the list
    $('#partners-list li').each(function() {
        partnersArray.push($(this).text());
    });

    // Initialize jQuery UI Autocomplete
    $('#search-input').autocomplete({
        source: partnersArray, // Use the array as the source for autocomplete
        minLength: 1, // Minimum length of input before suggestions appear
        select: function(event, ui) {
            // Set the input value to the selected item's value
            $('#search-input').val(ui.item.value);

            // Trigger the search action or form submission immediately
            $('#partners-list li').each(function() {
                let listItemText = $(this).text().toLowerCase();
                
               
                if (listItemText === ui.item.value.toLowerCase()) {

                    $(this).click(); // Trigger click event on the matched list item
                }
            });

            return false; // Prevent the default behavior
        }
    });

    // Optional: Implement the filtering logic
    $('#search-input').on('keyup', function(e) {
        let searchText = $(this).val().toLowerCase();


 // Check for Enter (keyCode 13) or Right Arrow (keyCode 39)
    if (e.keyCode === 13 || e.keyCode === 39) {
        let matchedItem = null;

        $('#partners-list li').each(function() {
            let listItemText = $(this).text().toLowerCase();

            if (listItemText === searchText) {
                matchedItem = $(this); // Store the matched item
                return false; // Break the loop
            }
        });

        if (matchedItem) {
            matchedItem.click(); // Trigger click event on the matched list item
            $("#search-input").val(''); // Clear input field
            $('#search-suggestion_2').text(''); // Clear suggestions
        }
    }



//         $('#partners-list li').each(function() {
//             let listItemText = $(this).text().toLowerCase();
//            // $(this).toggle(listItemText.indexOf(searchText) !== -1); // Show/hide based on search

// if (listItemText === searchText) {

//                     $(this).click(); // Trigger click event on the matched list item

//                      $("#search-input").val('');
//                      $('#search-suggestion_2').text('');
                   



//                 }

//         });



    });



const MySearch = document.getElementById("search-input");

MySearch.addEventListener("keydown", (e) => {
    // Check for the 'Enter' key
    if (e.key === "Enter") {
        let searchText = MySearch.value.toLowerCase(); // Get the input value in lowercase

        // Iterate through each list item in the partners list
        $('#partners-list li').each(function() {
            let listItemText = $(this).text().toLowerCase(); // Get list item text in lowercase

            // Check if list item text matches the search text exactly
            if (listItemText === searchText) {
                $(this).click(); // Trigger click event on the matched list item
                MySearch.value = ''; // Clear the search input
                $('#search-input').focus();
            }
        });
    } else if (e.key === "ArrowRight") {
        // Add functionality for ArrowRight if needed


        // Iterate through each list item in the partners list
        $('#partners-list li').each(function() {
            let listItemText = $(this).text().toLowerCase(); // Get list item text in lowercase

            // Check if list item text matches the search text exactly
            if (listItemText === searchText) {
                $(this).click(); // Trigger click event on the matched list item
                MySearch.value = ''; // Clear the search input
                $('#search-input').focus();
            }
        });

    }






});





});



$(document).on("click", "tr td", function(e) {
    // Get the clicked row
    var clickedRow = $(this).closest("tr");

    // Check if the row has the 'table-red' class
    if (clickedRow.hasClass('table-red')) {
        // If it's a deleted row, don't make it active and exit
        return;
    }

    // Remove 'active' class from all rows
    $('#transactionstable tbody tr').removeClass('active_row');

    // Add 'active' class to the clicked row
    clickedRow.addClass('active_row');

    // Optional: alert the content of the clicked cell
    // alert(e.target.innerHTML);
});


$(document).ready(function() {


    $('li[data-partner_id]').on('click', function() {
        $('li[data-partner_id]').removeClass('active-tab');
        $(this).addClass('active-tab');

        const Access='{{$response['company']['access_level']}}';

        if(Access=='full')
        {
        $('.sec-actions').show();
            
        }

$('#transaction_id').val('');

        $('#register_entry')[0].reset();

        const partnerId = $(this).data('partner_id');
        const name = $(this).data('name');
        const userId = $(this).data('user_id');
        const limit = 20; // Set your desired limit

        $('#product_id').val(partnerId);
        
      if (/^[a-zA-Z]+$/.test(name)) {
    // If 'name' is alphabetic, convert to uppercase
    $('.active_user').text(name.toUpperCase());
} else if (/^\d+$/.test(name)) {
    // If 'name' is numeric, leave it as is
    $('.active_user').text(name);
} else {
    // Optional: Handle mixed or other types of input
    $('.active_user').text(name); // Keep the original input
}


        
        fetchTransactions(partnerId, userId);
        



// function fetchTransactions(partnerId, userId) {
//     $.ajax({
//         url: "{{ route('transactions.get') }}",
//         method: "POST",
//         data: {
//             partner_id: partnerId,
//             user_id: userId,
//             _token: '{{ csrf_token() }}'
//         },
//         success: function (response) {
//             console.log(response);

//             // Destroy existing DataTable instance before clearing table body
//             if ($.fn.DataTable.isDataTable('#transactionstable')) {
//                 $('#transactionstable').DataTable().destroy();
//             }

//             // Clear the table body
//             $('#transactionstable tbody').empty();

//             let transactions = response.transactions;
//             let totalCredit = 0;
//             let totalDebit = 0;
//             let runningBalance = 0;

//             // Perform calculations first
//             transactions.forEach((transaction) => {
//                 const credit = transaction.credit || 0;
//                 const debit = transaction.debit || 0;
//                 const coins = transaction.coins || 0;
//                 const rate = transaction.rate || 0;

//                 totalCredit += credit;
//                 totalDebit += debit;

//                 if (transaction.deleted === 1) {
//                     transaction.calculatedBalance = runningBalance;
//                 } else {
//                     const transactionAmount = coins * rate;
//                     runningBalance += transactionAmount;
//                     transaction.calculatedBalance = runningBalance;
//                 }
//             });

//             transactions.reverse();
//             // Populate the table
//             transactions.forEach((transaction, index) => {
//                 const credit = transaction.credit || 0;
//                 const debit = transaction.debit || 0;
//                 const coins = transaction.coins || 0;
//                 const rate = transaction.rate || 0;

//                 let rowClass = '';
//                 if (transaction.credit !== 0 && transaction.credit !== null) {
//                     rowClass = 'table-warning';
//                 } else if (transaction.debit !== 0 && transaction.debit !== null) {
//                     rowClass = 'table-danger';
//                 }
//                 if (transaction.deleted == 1) {
//                     rowClass = 'table-red';
//                 } else if (transaction.modified == 1) {
//                     rowClass = 'table-info';
//                 }

//                 // const formattedDate = new Date(transaction.timestamp * 1000).toLocaleString();

//                 const timestamp = transaction.timestamp; // Assuming it's in seconds
// const date = new Date(timestamp * 1000);

// // Format in dd/mm/yy and time (hh:mm:ss)
// const formattedDate = date.toLocaleString("en-IN", {
//   day: "2-digit",
//   month: "2-digit",
//   year: "2-digit",
//   hour: "2-digit",
//   minute: "2-digit",
//   second: "2-digit",
//   hour12: true, // Set to true if you prefer 12-hour format
// });


//                 const productOrNameId = transaction.product_id !== partnerId
//                     ? transaction.product_id_name
//                     : transaction.name_id_name;

//                 const row = `
//                     <tr class="${rowClass}" data-transaction_id="${transaction.transaction_id}" data-product_id="${transaction.product_id}"  data-product_id_name="${transaction.product_id_name}"   data-name_id="${transaction.name_id}" data-name_id_name="${transaction.name_id_name}" data-coins="${transaction.coins}" data-rate="${transaction.rate}" data-remarks="${transaction.remarks}">
//                         <td>${index + 1}</td>
//                         <td>${formattedDate}</td>
//                         <td>${productOrNameId}</td>
//                         <td>${transaction.remarks ?? ''}</td>
//                         <td>${coins}</td>
//                         <td>${rate}</td>
//                         <td>${credit || ''}</td>
//                         <td>${debit || ''}</td>
//                         <td>${transaction.calculatedBalance}</td>
//                     </tr>
//                 `;

//                 $('#transactionstable tbody').append(row);
//             });

//             // Initialize DataTable
//             $('#transactionstable').DataTable({
//                 destroy: true, // Ensure existing instance is destroyed
//                 paging: true,  // Enable pagination
//                 pageLength: 20, // Default rows per page
//                 searching: true, // Enable search
//                 ordering: true, // Enable column ordering
//                 info: true, // Show table info
//             });

//             // Handle print button
//             if (response.print_url) {
//                 $('.print-btn').html(`<a href="${response.print_url}" target="_blank"><button>Print</button></a>`);
//             }

//             get_report();
//         },
//         error: function (xhr, status, error) {
//             Swal.fire("Error", "Failed to fetch transactions.", "error");
//             console.error(xhr.responseText);
//         }
//     });
// }



function fetchTransactions(partnerId, userId) {
    $.ajax({
        url: "{{ route('transactions.get') }}",
        method: "POST",
        data: {
            partner_id: partnerId,
            user_id: userId,
            _token: '{{ csrf_token() }}'
        },
        success: function (response) {
            console.log(response);

            // Destroy existing DataTable instance before clearing table body
            if ($.fn.DataTable.isDataTable('#transactionstable')) {
                $('#transactionstable').DataTable().destroy();
            }

            // Clear the table body
            $('#transactionstable tbody').empty();

            let transactions = response.transactions;
            let totalCredit = 0;
            let totalDebit = 0;
            let runningBalance = 0;

            // Perform calculations and round off
            transactions.forEach((transaction) => {
                // Safely parse values or use a default of 0
                const credit = Math.round(parseFloat(transaction.credit) || 0); // Round off to integer
                const debit = Math.round(parseFloat(transaction.debit) || 0);   // Round off to integer
                const coins = parseFloat(transaction.coins) || 0;
                const rate = parseFloat(transaction.rate) || 0;

                totalCredit += credit;
                totalDebit += debit;

                if (transaction.deleted === 1) {
                    transaction.calculatedBalance = runningBalance;
                } else {
                    const transactionAmount = coins * rate;
                    runningBalance += transactionAmount;
                    transaction.calculatedBalance = runningBalance;
                }

                // Round off credit, debit, and calculatedBalance to integers
                transaction.credit = credit;
                transaction.debit = debit;
                transaction.rate = rate.toFixed(3); // Keep rate with 3 decimal places if needed
                transaction.calculatedBalance = Math.round(transaction.calculatedBalance);
            });

            transactions.reverse();
            // Populate the table
            transactions.forEach((transaction, index) => {
                const credit = transaction.credit || 0;
                const debit = transaction.debit || 0;
                const coins = transaction.coins || 0;
                const rate = transaction.rate || 0;

                let rowClass = '';
                if (transaction.credit !== 0 && transaction.credit !== null) {
                    rowClass = 'table-warning';
                } else if (transaction.debit !== 0 && transaction.debit !== null) {
                    rowClass = 'table-danger';
                }
                if (transaction.deleted == 1) {
                    rowClass = 'table-red';
                } else if (transaction.modified == 1) {
                    rowClass = 'table-info';
                }

                const timestamp = transaction.timestamp; // Assuming it's in seconds
                const date = new Date(timestamp * 1000);

                // Format in dd/mm/yy and time (hh:mm:ss)
                const formattedDate = date.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true, // Set to true if you prefer 12-hour format
                });

                const Name = transaction.product_id !== partnerId
                    ? transaction.product_id_name
                    : transaction.name_id_name;


const Product = transaction.product_id !== partnerId
                    ? transaction.name_id_name
                    : transaction.product_id_name;



                  const Name_id = transaction.product_id !== partnerId
                    ? transaction.product_id
                    : transaction.name_id;


const Product_id = transaction.product_id !== partnerId
                    ? transaction.name_id
                    : transaction.product_id;

                const row = `
                    <tr class="${rowClass}" data-transaction_id="${transaction.transaction_id}" data-product_id="${Product_id}"  data-product_id_name="${Product}"   data-name_id="${Name_id}" data-name_id_name="${Name}" data-coins="${transaction.coins}" data-rate="${transaction.rate}" data-remarks="${transaction.remarks}">
                        <td>${index + 1}</td>
                        <td>${formattedDate}</td>
                        <td>${Name}</td>
                        <td>${transaction.remarks ?? ''}</td>
                        <td>${coins}</td>
                        <td>${rate}</td>
                        <td>${credit || ''}</td>
                        <td>${debit || ''}</td>
                        <td>${transaction.calculatedBalance}</td>
                    </tr>
                `;

           

                $('#transactionstable tbody').append(row);
            });

            // Initialize DataTable
            $('#transactionstable').DataTable({
                destroy: true, // Ensure existing instance is destroyed
                paging: true,  // Enable pagination
                pageLength: 20, // Default rows per page
                searching: true, // Enable search
                ordering: true, // Enable column ordering
                info: true, // Show table info
            });

            // Handle print button
            if (response.print_url) {
                $('.print-btn').html(`<a href="${response.print_url}" target="_blank"><button>Print</button></a>`);
            }

            get_report();
        },
        error: function (xhr, status, error) {
            Swal.fire("Error", "Failed to fetch transactions.", "error");
            console.error(xhr.responseText);
        }
    });
}









    });

$('#register_entry').on('submit', function(e) {
    e.preventDefault();

    let formData = {
        _token: '{{ csrf_token() }}',
        name_id: $('#name_id').val(),
        product_id: $('#product_id').val(),
        coins: $('input[name="coins"]').val(),
        rate: $('input[name="rate"]').val(),
        remarks: $('input[name="remarks"]').val(),
        transaction_id: $('#transaction_id').val(),
        partner_id:$('li[data-partner_id].active-tab').data('partner_id'),
    };

$('#register_entry')[0].reset();

    $.ajax({
        url: "{{ route('transactions.store') }}",
        type: 'POST',
        data: formData,
        success: function(response) {
            console.log("Response:", response); // Log the AJAX response
            let message = $('#transaction_id').val() !== '' ? 'Transaction updated successfully!' : 'Transaction created successfully!';
            console.log("Success Message:", message); // Log the success message
            //Swal.fire("Success", message, "success"); // Ensure this line is correct as per your SweetAlert version
            $('#register_entry')[0].reset();
            $('li[data-partner_id].active-tab').trigger('click');
            get_report();

$('#name_id').val('');
$('#Name_id_name').focus();

$('#product_id').val('');
$('#product_id').val($('li[data-partner_id].active-tab').data('partner_id'));



        },
        error: function(xhr, status, error) {
            console.error("Error:", xhr.responseText); // Log the error response
           Swal.fire({
    icon: "error",
    title: "Error",
    html: formatErrors(xhr.responseText),
});


        }
    });
});




// Function to format the errors into an HTML list
function formatErrors(responseText) {
    let errorList = "<ul>";
    try {
        // Parse the JSON response
        const response = JSON.parse(responseText);
        
        // Extract and format errors
        if (response.errors) {
            for (const [field, messages] of Object.entries(response.errors)) {
                messages.forEach(message => {
                    errorList += `<li>${message}</li>`;
                });
            }
        } else {
            errorList += "<li>An unexpected error occurred.</li>";
        }
    } catch (e) {
        // Fallback in case the response is not JSON
        errorList += "<li>Unable to parse error details.</li>";
    }
    errorList += "</ul>";
    return errorList;
}





});


    function get_delete() {
        var activeRow = $('#transactionstable tbody tr.active_row');

        if (activeRow.length > 0) {
            var transactionId = activeRow.data('transaction_id');

            Swal.fire({
                title: "Are you sure?",
                text: "Do you really want to delete this transaction?",
                icon: "warning",
                buttons: ["Cancel", "Delete"],
                dangerMode: true,
            }).then((willDelete) => {
                if (willDelete) {
                    $.ajax({
                        url: "{{ route('transactions.delete') }}",
                        type: 'POST',
                        data: {
                            _token: '{{ csrf_token() }}',
                            transaction_id: transactionId
                        },
                        success: function(response) {
                            if (response.success) {
                                Swal.fire("Success", "Transaction deleted successfully!", "success");
                                $('li[data-partner_id].active-tab').trigger('click');
                                
                            } else {
                                Swal.fire("Error", response.message, "error");
                               

                            }

                            get_report();
                        },
                        error: function(xhr, status, error) {
                            Swal.fire("Error", "An error occurred: " + xhr.responseText, "error");
                        }
                    });
                }
            });
        } else {
            Swal.fire("Error", "Please select a row to delete", "warning");
        }
    }


    function get_modify() {

        var activeRow = $('#transactionstable tbody tr.active_row');
        if (activeRow.length > 0) {
            var transactionId = activeRow.data('transaction_id');
            var productId = activeRow.data('product_id');
            var nameId = activeRow.data('name_id');
            var nameIdName = activeRow.data('name_id_name');
            var coins = activeRow.data('coins');
            var rate = activeRow.data('rate');
            var remarks = activeRow.data('remarks');

            $('#product_id').val(productId);
            $('#name_id').val(nameId);
            $('#Name_id_name').val(nameIdName);
            $('input[name="coins"]').val(coins);
            $('input[name="rate"]').val(rate);
            $('input[name="remarks"]').val(remarks);
            $('#transaction_id').val(transactionId);

            getbal(nameIdName);


           
        } else {
            Swal.fire("Error", "Please select a row to modify", "warning");
        }
    }



function getbal(inputValue) {
    // Convert inputValue to a string and apply toLowerCase if necessary
    const inputStr = String(inputValue).toLowerCase();


$('#Balance_put').val('');
$('#name_id').val('');

$('#error').text('');


 // Check if creating a transaction from the same user
    if ($('#transaction_id').val() === '' && (inputStr === String($('li[data-partner_id].active-tab').text()).toLowerCase())) {
        $('#error').text("Can't create transaction from the same user");
        return; // Exit the function if the condition is met
    }


    // Loop through each partner list item
    $('#partners-list li').each(function() {
        const partnerName = $(this).text().trim().toLowerCase(); // Convert partner name to lowercase for comparison
        const partnerId = $(this).data('partner_id'); // Get the partner_id from the list
        const userId = $(this).data('user_id'); // Get the user_id from the list

        const companyID = @json(request('companyID'));

        // Check if inputStr matches the partner's name
        if (partnerName === inputStr) {
            // Perform AJAX request if a match is found
            $.ajax({
                url: "{{ route('company-info-ajax') }}", // Replace with your actual route for fetching company info
                method: "GET",
                data: {
                    companyID: companyID,
                    _token: '{{ csrf_token() }}'
                },
                success: function(response) {
                    console.log("Response: ", response);

                    // Loop through active partners from the response
                    response.company.active_partners.forEach(function(partner) {
                        console.log(partner);
                        console.log("match: ", partner.id === partnerId);

                        // Check if partner ID from response matches the partnerId from the list item
                        if (partner.id === partnerId) {
                            // Update the balance in the desired element
                            $('#Balance_put').val(partner.balance); // For div/span
                            $('#name_id').val(partner.id); // For div/span

                            $("#coins").focus();
                        }
                    });
                },
                error: function(xhr, status, error) {
                    Swal.fire("Error", "Failed to fetch partner balance.", "error");
                    console.error(xhr.responseText);
                }
            });

            // Exit loop once a match is found
            return false;
        }
    });
}


function get_report(){
     
  const partnerId = $('#product_id').val();

        const companyID = @json(request('companyID'));
            $.ajax({
                url: "{{ route('company-info-ajax') }}", // Replace with your actual route for fetching company info
                method: "GET",
                data: {
                    companyID: companyID,
                    _token: '{{ csrf_token() }}'
                },
                success: function(response) {
                    console.log("Response: ", response);

                    // Loop through active partners from the response
                    response.company.active_partners.forEach(function(partner) {
                        console.log(partner);
                        console.log("match: ", partner.id === partnerId);

                        // Check if partner ID from response matches the partnerId from the list item
                        if (partner.id === partnerId) {

$('#report_user').text(partner.name);
$('#report_balance').text(Math.round(partner.balance));
$('#closing_bal').text(Math.round(partner.balance));

// Change color based on balance value
if (partner.balance < 0) {
    $('#closing_bal').css('color', 'red');
} else {
    $('#closing_bal').css('color', 'blue');
}

                        }
                    });
                },
                error: function(xhr, status, error) {
                    Swal.fire("Error", "Failed to fetch partner balance.", "error");
                    console.error(xhr.responseText);
                }
            });

}

</script>


<!-- autocomplete js for name -->


<script>
   
// const predefinedSuggestions = $('#partners-list li').map(function() {
//     return $(this).text().trim(); // Get and trim the text of each <li>
// }).get(); // Convert jQuery result to a plain array


const predefinedSuggestions = $('#partners-list li')
    .map(function () {
        return $(this).text().trim(); // Get and trim the text of each <li>
    })
    .get() // Convert jQuery result to a plain array
    .sort((a, b) => a.length - b.length); // Sort by length of elements


    const searchInput = document.getElementById("Name_id_name");
    const searchSuggestion = document.getElementById("search-suggestion");
    const autocompleteList = document.getElementById("autocomplete-list");

    // Function to update the overlaid suggestion
    function updateSuggestion(value) {
        if (value) {
            const match = predefinedSuggestions.find(item =>
                item.toLowerCase().startsWith(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
            );
            if (match) {
                const rest = match.substring(value.length);
                searchSuggestion.textContent = rest;

                // Position the suggestion text after the user's input
                const inputWidth = getTextWidth(value, searchInput);
                searchSuggestion.style.left = (16 + inputWidth) + 'px';
            } else {
                searchSuggestion.textContent = '';
            }
        } else {
            searchSuggestion.textContent = '';
            searchSuggestion.style.left = '10px';
        }
    }

    // Utility function to measure text width
    function getTextWidth(text, input) {
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        const font = window.getComputedStyle(input).font;
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    // Function to show dropdown suggestions
    function showSuggestions(value) {
        autocompleteList.innerHTML = "";
        if (value) {
            const matches = predefinedSuggestions.filter(item =>
                item.toLowerCase().startsWith(value.toLowerCase())
            );

            if (matches.length > 0) {
                matches.forEach((suggestion) => {
                    const item = document.createElement("div");
                    item.classList.add("autocomplete-item");
                    item.textContent = suggestion;

                    item.addEventListener("mousedown", (e) => {
                        e.preventDefault(); // Prevent input blur
                        selectSuggestion(suggestion);
                    });

                    autocompleteList.appendChild(item);
                });
            }
        }
    }

    // Function to handle suggestion selection
    function selectSuggestion(suggestion) {
        searchInput.value = suggestion;


getbal(suggestion);

        searchSuggestion.textContent = '';
        autocompleteList.innerHTML = "";
        // Remove focus from the input field if desired
        searchInput.blur();
    }

    // Event listener for input changes
    searchInput.addEventListener("input", () => {

$('#Balance_put').val('');
$('#name_id').val('');

$('#error').text('');

        const value = searchInput.value;

      

              

        updateSuggestion(value);
        showSuggestions(value);
    });


let lastBackspaceTime = 0;
let backspaceCount = 0;
let backspaceTimeout;

    // Handle keyboard events
    searchInput.addEventListener("keydown", (e) => {
       $('#Balance_put').val('');
$('#name_id').val('');

$('#error').text('');
        if (e.key === "ArrowRight") {
            if (searchSuggestion.textContent) {
                searchInput.value += searchSuggestion.textContent;


getbal(searchInput.value);

                searchSuggestion.textContent = '';
                autocompleteList.innerHTML = "";
                e.preventDefault();
            }
        } else if (e.key === "Enter") {

           $('#Balance_put').val('');
$('#name_id').val('');

$('#error').text('');

            if (searchSuggestion.textContent) {
                searchInput.value += searchSuggestion.textContent;


getbal(searchInput.value);

                searchSuggestion.textContent = '';
                autocompleteList.innerHTML = "";
                searchInput.blur();
                e.preventDefault();
            }else
            {
              getbal($('#Name_id_name').val());
               searchSuggestion.textContent = '';
                autocompleteList.innerHTML = "";
                searchInput.blur();
                e.preventDefault();
            }




        }    
    // Handle Backspace key
    else if (e.key === "Backspace") {
        backspaceCount++; // Increment backspace counter on each press

        // Single backspace press: Clear the suggestion text
        if (backspaceCount === 1) {
            searchSuggestion.textContent = ''; // Clear suggestion
        } 
        // Double backspace press: Remove the last character from input value
        else if (backspaceCount === 2) {
            // Remove the last character from the searchInput value
            if (searchInput.value.length > 0) {
                searchInput.value = searchInput.value.slice(0, -1);
            }
            backspaceCount = 0; // Reset counter after double backspace action
        }

        // Prevent default backspace behavior (removes from input field)
        e.preventDefault();
    }



    });

    // Close suggestions when clicking outside
    document.addEventListener("mousedown", (e) => {
        if (!autocompleteList.contains(e.target) && e.target !== searchInput) {
            autocompleteList.innerHTML = "";
        }
    });
</script>

<!-- end auto complete js for name  -->


<!-- for search autocomplete -->



<script>
   
const predefinedSuggestions2 = $('#partners-list li')
    .map(function () {
        return $(this).text().trim(); // Get and trim the text of each <li>
    })
    .get() // Convert jQuery result to a plain array
    .sort((a, b) => a.length - b.length); // Sort by length of elements



    const searchInput2 = document.getElementById("search-input");
    const searchSuggestion2 = document.getElementById("search-suggestion_2");
    // const autocompleteList2 = document.getElementById("partners-list li");

    // Function to update the overlaid suggestion
    function updateSuggestion2(value) {
        if (value) {
            const match = predefinedSuggestions2.find(item =>
                item.toLowerCase().startsWith(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
            );
            if (match) {
                const rest = match.substring(value.length);
                searchSuggestion2.textContent = rest;

                // Position the suggestion text after the user's input
                const inputWidth = getTextWidth2(value, searchInput2);
                searchSuggestion2.style.left = (25 + inputWidth) + 'px';
            } else {
                searchSuggestion2.textContent = '';
            }
        } else {
            searchSuggestion2.textContent = '';
            searchSuggestion2.style.left = '20px';
        }
    }

    // Utility function to measure text width
    function getTextWidth2(text, input) {
        const canvas = getTextWidth2.canvas || (getTextWidth2.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        const font = window.getComputedStyle(input).font;
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    // Function to show dropdown suggestions
    function showSuggestions2(value) {
        // autocompleteList2.innerHTML = "";
        if (value) {
            const matches = predefinedSuggestions2.filter(item =>
                item.toLowerCase().startsWith(value.toLowerCase())
            );

            if (matches.length > 0) {
                matches.forEach((suggestion) => {
                    const item = document.createElement("div");
                    item.classList.add("autocomplete-item");
                    item.textContent = suggestion;

                    item.addEventListener("mousedown", (e) => {
                        e.preventDefault(); // Prevent input blur
                        selectSuggestion2(suggestion);
                    });

                    // autocompleteList2.appendChild(item);
                });
            }
        }
    }

    // Function to handle suggestion selection
    function selectSuggestion2(suggestion) {
        searchInput2.value = suggestion;


// getbal(suggestion);

        searchSuggestion2.textContent = '';
        // autocompleteList2.innerHTML = "";
        // Remove focus from the input field if desired
        searchInput2.blur();
    }

    // Event listener for input changes
    searchInput2.addEventListener("input", () => {
        const value = searchInput2.value;
        updateSuggestion2(value);
        showSuggestions2(value);
    });


let lastBackspaceTime2 = 0;
let backspaceCount2 = 0;
let backspaceTimeout2;

    // Handle keyboard events
    searchInput2.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
            if (searchSuggestion2.textContent) {
                searchInput2.value += searchSuggestion2.textContent;


// getbal(searchInput2.value);

                searchSuggestion2.textContent = '';
                // autocompleteList2.innerHTML = "";
                e.preventDefault();
            }
        } else if (e.key === "Enter") {
            if (searchSuggestion2.textContent) {
                searchInput2.value += searchSuggestion2.textContent;


// getbal(searchInput2.value);

                searchSuggestion2.textContent = '';
                // autocompleteList2.innerHTML = "";
                searchInput2.blur();
                e.preventDefault();
            }
        }
            // Handle Backspace key
    else if (e.key === "Backspace") {
        backspaceCount2++; // Increment backspace counter on each press

        // Single backspace press: Clear the suggestion text
        if (backspaceCount2 === 1) {
            searchSuggestion2.textContent = ''; // Clear suggestion
        } 
        // Double backspace press: Remove the last character from input value
        else if (backspaceCount2 === 2) {
            // Remove the last character from the searchInput value
            if (searchInput2.value.length > 0) {
                searchInput2.value = searchInput2.value.slice(0, -1);
            }
            backspaceCount2 = 0; // Reset counter after double backspace action
        }

        // Prevent default backspace behavior (removes from input field)
        e.preventDefault();
    }








    });

    // Close suggestions when clicking outside
    // document.addEventListener("mousedown", (e) => {
    //     if (!autocompleteList2.contains(e.target) && e.target !== searchInput2) {
    //         autocompleteList2.innerHTML = "";
    //     }
    // });
</script>

<!-- remarks autofill -->
<script>
    // Define the predefined suggestions array (initial value)
    let predefinedSuggestions3 = [];
        const companyID = @json(request('companyID'));
    // AJAX call to fetch the remarks dynamically
    $.ajax({
        url: "{{route('remarks')}}",  // Replace with the correct URL to your get_remarks route
        type: 'GET',
         data: {
                    companyID: companyID,
                    _token: '{{ csrf_token() }}'
                },
        success: function(response) {
            // Update the predefinedSuggestions3 array with the fetched remarks
            predefinedSuggestions3 = response;


 // Sort the array by the length of each element
        predefinedSuggestions3.sort((a, b) => a.length - b.length);
        
            // Optionally log the updated array
            console.log(predefinedSuggestions3);

            // Now you can use the updated predefinedSuggestions3 for your search or suggestions functionality
        },
        error: function(error) {
            console.error('Error fetching remarks:', error);
        }
    });

    const remarksInput = document.getElementById("remarks");
    const searchSuggestion3 = document.getElementById("search-suggestion3");
    const autocompleteList3 = document.getElementById("autocomplete-list3");

    // Function to update the overlaid suggestion for remarks
    function updateSuggestion3(value) {
        if (value) {
            const match = predefinedSuggestions3.find(item =>
                item.toLowerCase().startsWith(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
            );
            if (match) {
                const rest = match.substring(value.length);
                searchSuggestion3.textContent = rest;

                // Position the suggestion text after the user's input
                const inputWidth = getTextWidth(value, remarksInput);
                searchSuggestion3.style.left = (15 + inputWidth) + 'px';
            } else {
                searchSuggestion3.textContent = '';
            }
        } else {
            searchSuggestion3.textContent = '';
            searchSuggestion3.style.left = '13px';
        }
    }

    // Utility function to measure text width
    function getTextWidth(text, input) {
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        const font = window.getComputedStyle(input).font;
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    // Function to show dropdown suggestions for remarks
    function showSuggestions3(value) {
        autocompleteList3.innerHTML = "";
        if (value) {
            const matches = predefinedSuggestions3.filter(item =>
                item.toLowerCase().startsWith(value.toLowerCase())
            );

            if (matches.length > 0) {
                matches.forEach((suggestion) => {
                    const item = document.createElement("div");
                    item.classList.add("autocomplete-item");
                    item.textContent = suggestion;

                    item.addEventListener("mousedown", (e) => {
                        e.preventDefault(); // Prevent input blur
                        selectSuggestion3(suggestion);
                    });

                    autocompleteList3.appendChild(item);
                });
            }
        }
    }

    // Function to handle suggestion selection for remarks
    function selectSuggestion3(suggestion) {
        remarksInput.value = suggestion;
        searchSuggestion3.textContent = '';
        autocompleteList3.innerHTML = "";
        // Remove focus from the input field if desired
        remarksInput.blur();
    }

    // Event listener for input changes
    remarksInput.addEventListener("input", () => {
        const value = remarksInput.value;
        updateSuggestion3(value);
        showSuggestions3(value);
    });




let lastBackspaceTime3 = 0;
let backspaceCount3 = 0;
let backspaceTimeout3;


    // Handle keyboard events
    remarksInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
            if (searchSuggestion3.textContent) {
                remarksInput.value += searchSuggestion3.textContent;
                searchSuggestion3.textContent = '';
                autocompleteList3.innerHTML = "";
                e.preventDefault();
            }
        } else if (e.key === "Enter") {
            if (searchSuggestion3.textContent) {
                remarksInput.value += searchSuggestion3.textContent;
                searchSuggestion3.textContent = '';
                autocompleteList3.innerHTML = "";
                remarksInput.blur();
                e.preventDefault();
            }
        }
    // Handle Backspace key
    else if (e.key === "Backspace") {
        backspaceCount3++; // Increment backspace counter on each press


        // Single backspace press: Clear the suggestion text
        if (backspaceCount3 === 1) {
            searchSuggestion3.textContent = ''; // Clear suggestion
        } 
        // Double backspace press: Remove the last character from input value
        else if (backspaceCount3 === 2) {
             backspaceCount3 = 0;
            // Remove the last character from the searchInput value
            if (searchInput3.value.length > 0) {
                searchInput3.value = searchInput3.value.slice(0, -1);
            }
            // Reset counter after double backspace action
        }

        // Prevent default backspace behavior (removes from input field)
        e.preventDefault();
    }






    });

    // Close suggestions when clicking outside
    document.addEventListener("mousedown", (e) => {
        if (!autocompleteList3.contains(e.target) && e.target !== remarksInput) {
            autocompleteList3.innerHTML = "";
        }
    });
</script>
<!-- end remarks autofill -->



<script type="text/javascript">
    

     $("#coins").on("focus", function() {
        var bal=$('#Balance_put').val();
        if(bal=='')
        {
            var name=$('#Name_id_name').val();
            $('#search-suggestion').text('');
            getbal(name);

        }
    });


</script>


<script>
$(document).ready(function(){
  $(".togg_switc").click(function(){
    $("#search_hide_show").toggleClass("main");
  });
});
</script>
@endsection
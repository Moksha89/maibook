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

    <meta name="csrf-token" content="{{ csrf_token() }}">

     <link rel="stylesheet" href="{{asset('css/style.css')}}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.5/css/dataTables.bootstrap5.min.css">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
 <!-- Bootstrap CSS -->
<link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">



<link rel="stylesheet" href="{{asset('assets_admin/css/mibook-theme.css')}}?v={{ time() }}">
</head>
<style type="text/css">
    form#Logout_form {
    cursor: pointer;
}
    .col-sm-4 {
    margin-bottom: 20px !important;
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
    padding-left: 0px !important;
    padding-right: 0px !important;
}
.navbar-sec a.navbar-brand {
    color: #000;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
}
.logout-btn i.fa.fa-gear {
    font-size: 25px;
    margin-right: 10px;
}
.logout-btn {
    display: flex;
    align-items: center;
    position: relative;
}
.logout-btn a {
    font-size: 18px;
    text-decoration: none;
}
.logout-btn a {
    font-size: 18px;
    text-decoration: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    color: #FFC107;
    padding: 0px 15px 0px 0px !important;
    border-radius: 6px;
    z-index: 9999;
    position: relative;
}

/*.logout-btn::after {
    content: '';
    border-left: 2px solid #000000e0;
    position: absolute;
    top: 5px;
    width: 100%;
    height: 70%;
    right: 15px;
    background-repeat: no-repeat;
}*/

.navbar-brand:hover {
    color: blueviolet !important;
}

a.set_btn {
    background: #fff;
    color: black;
}
.mobile-navbar {
    display: none;
}



@media(min-width: 240px) and (max-width: 479px) {

.logout-btn a.set_btn {
    padding: 6px !important;
}
.logout-btn form a {
    padding: 5px 15px !important;
    line-height: normal !important;
}


header.menu-head-sec {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    display: none;
}
.mobile-navbar {
    display: block;
}
.mobile-navbar nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky;
}
a.navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}
.mobile-navbar .navbar .container-fluid {
    padding: 0px;
}
.logout-btn {
    display: block;
    padding: 0px 20px;
}
.logout-btn i.fa.fa-gear {
    margin-right: 0px;
}
.logout-btn a.set_btn {
    width: fit-content;
    text-align: center;
    margin-bottom: 20px;
}
.logout-btn form a {
    width: fit-content;
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
}


@media(min-width: 480px) and (max-width: 767px) {

header.menu-head-sec {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    display: none;
}
.mobile-navbar {
    display: block;
}
.mobile-navbar nav.navbar.navbar-dark.bg-dark.fixed-top {
    position: sticky;
}
a.navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}
.mobile-navbar .navbar .container-fluid {
    padding: 0px;
}
.logout-btn {
    display: block;
    padding: 0px 20px;
}
.logout-btn i.fa.fa-gear {
    margin-right: 0px;
}
.logout-btn a.set_btn {
    width: fit-content;
    text-align: center;
    margin-bottom: 20px;
}
.logout-btn form a {
    width: fit-content;
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
}


@media(min-width: 768px) and (max-width: 999px) {

.navbar-sec .container-fluid {
    padding: 0px !important;
}
.navbar-sec nav.navbar.navbar-dark.bg-dark.fixed-top.back-new {
    padding-left: 0px !important;
    padding-right: 0px !important;
}
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



                                  <a class="navbar-brand" href="{{route('dashboard')}}"><img src="{{$logoUrl}}" height="50" width="50">{{$title}}</a>

 <div class="logout-btn">

    <a class="set_btn" href="{{route('setting')}}" ><i class="fa fa-gear"></i></a>
                                   <!-- Authentication -->
                        <form method="POST" id="Logout_form" action="{{ route('logout') }}">
                            @csrf

                            <x-dropdown-link :href="route('logout')"
                                    onclick="event.preventDefault();
                                                this.closest('form').submit();">
                                <i class="fa fa-power-off"></i>{{ __('Log Out') }}
                            </x-dropdown-link>
                 
                        </form>

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
   <a class="navbar-brand" href="{{route('dashboard')}}"><img src="{{$logoUrl}}" height="25" width="25">mibook.dev</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasDarkNavbar" aria-controls="offcanvasDarkNavbar" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasDarkNavbar" aria-labelledby="offcanvasDarkNavbarLabel">
      <div class="offcanvas-header">
          <a class="navbar-brand" href="{{route('dashboard')}}"><img src="{{$logoUrl}}" height="25" width="25">mibook.dev</a>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
<div class="logout-btn">

    <a class="set_btn" href="{{route('setting')}}" ><i class="fa fa-gear"></i></a>
                                   <!-- Authentication -->
                        <form method="POST" id="Logout_form" action="{{ route('logout') }}">
                            @csrf

                            <x-dropdown-link :href="route('logout')"
                                    onclick="event.preventDefault();
                                                this.closest('form').submit();">
                                <i class="fa fa-power-off"></i>{{ __('Log Out') }}
                            </x-dropdown-link>
                 
                        </form>

                    </div>
    </div>
  </div>
</nav>
</div>

<!-- end mobile navbar -->




 @yield('content')

 <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.5/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.5/js/dataTables.bootstrap5.min.js"></script>


<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


    @yield('scripts')

    </body>
</html>
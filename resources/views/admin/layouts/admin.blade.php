<!doctype html>

<html lang="en" data-theme="light">

<head>

<!-- No-flash dark mode initialization -->
<script>
(function(){
  var s = localStorage.getItem('mibook-theme');
  if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
</script>

  <meta charset="utf-8">

  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

  <!-- Meta -->

  <meta name="description" content="">

  <meta name="author" content="" />

  <meta property="og:title" content="">

  <meta property="og:description" content="">

  <meta property="og:type" content="Website">

  <meta property="og:site_name" content="mibook.dev">

  <link rel="shortcut icon" href="{{asset('assets_admin/images/logo.png')}}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

  <meta name="csrf-token" content="{{ csrf_token() }}">

  @php
  use Illuminate\Support\Facades\DB;
  $logoPath = DB::table('logo')->where('id', 1)->value('logo');
  $logoUrl = $logoPath ? asset($logoPath) : asset('default-logo.png');
  $title = Db::table('website_title')->where('id', 1)->value('title');
  @endphp

  <title>{{$title}}</title>

  <!-- Animated css -->
  <link rel="stylesheet" href="{{asset('assets_admin/css/animate.css')}}">

  <!-- Bootstrap font icons css -->
  <link rel="stylesheet" href="{{asset('assets_admin/fonts/bootstrap/bootstrap-icons.css')}}">

  <!-- Main css -->
  <link rel="stylesheet" href="{{asset('assets_admin/css/main.min.css')}}">
  <link rel="stylesheet" href="{{asset('assets_admin/css/custom-css.css')}}">
  <link rel="stylesheet" href="{{asset('css/style.css')}}">
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.21/css/jquery.dataTables.css">
  <link rel="stylesheet" href="{{asset('assets_admin/css/mibook-theme.css')}}?v={{ time() }}">

  <!-- Scrollbar CSS -->
  <link rel="stylesheet" href="{{asset('assets_admin/vendor/overlay-scroll/OverlayScrollbars.min.css')}}">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">

<!-- Premium theme handles active sidebar styling via mibook-theme.css -->

</head>

<body>

  <!-- Page wrapper start -->
  <div class="page-wrapper">

    <!-- Sidebar wrapper start -->
    <nav class="sidebar-wrapper">

      <!-- Sidebar brand starts -->
      <div class="sidebar-brand">
        <a href="{{route('dashboard')}}" class="logo">
          <img src="{{$logoUrl}}" alt="mibook.dev" />
        </a>
      </div>

      <!-- Sidebar menu starts -->
      <div class="sidebar-menu">
        <div class="sidebarMenuScroll">
          <ul>
            <li class="dashboard_home_li">
              <a href="{{route('admin.home')}}">
              <i class="fa fa-tachometer"></i>
                <span class="menu-text current-page">Dashboard</span>
              </a>
            </li>

            <li class="dashboard_li">
              <a href="{{route('admin.dashboard')}}">
              <i class="fa fa-repeat"></i>
                <span class="menu-text current-page">Backups</span>
              </a>
            </li>

            <li class="backup-emails_li">
              <a href="{{route('backup-emails.index')}}">
              <i class="fa fa-envelope"></i>
                <span class="menu-text current-page">Backup Emails</span>
              </a>
            </li>

            <li class="Campanies_li">
              <a href="{{route('all-companies')}}">
              <i class="fa fa-building"></i>
                <span class="menu-text current-page">Campanies</span>
              </a>
            </li>

            <li class="Company_Assignments_li">
              <a href="{{route('company_assignments')}}">
              <i class="fa fa-tasks"></i>
                <span class="menu-text current-page">Company Assignments</span>
              </a>
            </li>

            <li class="Website_Setting_li">
              <a href="{{route('logo')}}">
              <i class="fa fa-gear"></i>
                <span class="menu-text current-page">Website Setting</span>
              </a>
            </li>

            <li class="Partners_li">
              <a href="{{route('partner')}}">
              <i class="fa fa-handshake-o"></i>
                <span class="menu-text current-page">Partners</span>
              </a>
            </li>

            <li class="Transactions_li">
              <a href="{{route('admin_transaction')}}">
              <i class="fa fa-credit-card"></i>
                <span class="menu-text current-page">Transactions</span>
              </a>
            </li>

            <li class="Users_li">
              <a href="{{route('user')}}">
              <i class="fa fa-users"></i>
                <span class="menu-text current-page">Users</span>
              </a>
            </li>

            <li class="User_Company_Access_li">
              <a href="{{route('user_company_access')}}">
              <i class="fa fa-universal-access"></i>
                <span class="menu-text current-page">User Company Access</span>
              </a>
            </li>
            @if(Auth::user()->is_superadmin)
            <li class="WhatsApp_li">
              <a href="{{ route('whatsapp.settings') }}">
              <i class="fa fa-whatsapp"></i>
                <span class="menu-text current-page">WhatsApp</span>
              </a>
            </li>
            @endif
          </ul>
        </div>
      </div>
    </nav>

    <!-- Sidebar overlay for mobile -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <div class="main-container">

      <!-- Page header starts -->
      <div class="page-header">

        <!-- Toggle sidebar start -->
        <div class="toggle-sidebar" id="toggle-sidebar"><i class="bi bi-list"></i></div>

        <!-- Logo sm starts -->
        <a href="index.php" class="d-lg-none d-md-block mobile_logo_none">
          <img src="{{$logoUrl}}" class="logo-sm" alt="logo">
        </a>

        <!-- Breadcrumb start -->
        <ol class="breadcrumb d-lg-flex d-none">
          <li class="breadcrumb-item">
            <i class="bi bi-house"></i>
            <a href="{{ route('dashboard') }}">Home</a>
          </li>
          <li class="breadcrumb-item breadcrumb-active" aria-current="page">Dashboard</li>
        </ol>

        <!-- Header actions container start -->
        <div class="header-actions-container">

          <div class="search-container d-lg-block d-none">
          </div>

          <!-- Header actions start -->
          <ul class="header-actions">
            <!-- Dark mode toggle -->
            <li>
              <button class="dark-mode-toggle" id="darkModeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">
                <i class="bi bi-sun-fill icon-sun"></i>
                <i class="bi bi-moon-fill icon-moon"></i>
              </button>
            </li>

            <li class="dropdown">
              <a href="#" id="userSettings" class="user-settings" data-toggle="dropdown" aria-haspopup="true">
                <span class="user-name d-none d-md-block">{{ Auth::user()->name }}</span>
                <span class="avatar">
                  <img src="{{$logoUrl}}" alt="Admin">
                  <span class="status online"></span>
                </span>
              </a>
              <div class="dropdown-menu dropdown-menu-end" aria-labelledby="userSettings">
                <div class="header-profile-actions">
                  <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <x-dropdown-link :href="route('logout')" onclick="event.preventDefault();
                                                this.closest('form').submit();">
                      {{ __('Log Out') }}
                    </x-dropdown-link>
                  </form>
                </div>
              </div>
            </li>
          </ul>
          <!-- Header actions end -->

        </div>

      </div>

      <!-- Loader -->
      <div id="loader">
        <div class="spinner"></div>
      </div>

      <!-- Website Content -->
      <div id="content" style="display: none;">

        <script>
          window.addEventListener("load", function () {
            document.body.classList.add("loaded");
            document.getElementById("content").style.display = "block";
          });
        </script>

        <!-- Content wrapper scroll start -->
        <div class="content-wrapper-scroll">

          <!-- Content wrapper start -->
          <main role="main" id="main-content"><div class="content-wrapper">
            <h1 class="visually-hidden sr-only-h1">mibook.dev Admin Panel</h1>

            @yield('content')

            <!-- App Footer start -->
            <div class="app-footer">
              <span>&copy; mibook.dev {{ date('Y') }}</span>
            </div></main>

            <!-- datepicker -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
            <link rel="stylesheet" href="https://cdn.datatables.net/1.13.5/css/dataTables.bootstrap5.min.css">

          </div>

          <!-- Content wrapper scroll end -->
        </div>

      </div>
      <!-- Page wrapper end -->

      <!-- Required JavaScript Files -->
      <script src="{{asset('assets_admin/js/jquery.min.js')}}"></script>
      <script src="{{asset('assets_admin/js/bootstrap.bundle.min.js')}}"></script>
      <script src="{{asset('assets_admin/js/modernizr.js')}}"></script>
      <script src="{{asset('assets_admin/js/moment.js')}}"></script>

      <!-- Overlay Scroll JS -->
      <script src="{{asset('assets_admin/vendor/overlay-scroll/jquery.overlayScrollbars.min.js')}}"></script>
      <script src="{{asset('assets_admin/vendor/overlay-scroll/custom-scrollbar.js')}}"></script>

      <!-- Apex Charts: only load when chart containers exist on the page -->
      <script src="{{asset('assets_admin/vendor/apex/apexcharts.min.js')}}"></script>
      <script>
      (function() {
        var charts = [
          {id: '#salesGraph', src: '{{asset('assets_admin/vendor/apex/custom/sales/salesGraph.js')}}'},
          {id: '#revenueGraph', src: '{{asset('assets_admin/vendor/apex/custom/sales/revenueGraph.js')}}'},
          {id: '#taskGraph', src: '{{asset('assets_admin/vendor/apex/custom/sales/taskGraph.js')}}'},
        ];
        charts.forEach(function(c) {
          if (document.querySelector(c.id)) {
            var s = document.createElement('script');
            s.src = c.src;
            document.body.appendChild(s);
          }
        });
      })();
      </script>

      <!-- Main Js Required -->
      <script src="{{asset('assets_admin/js/main.js')}}"></script>
      <script type="text/javascript" src="https://cdn.datatables.net/1.10.21/js/jquery.dataTables.js"></script>
      <script src="{{asset('assets_admin/js/datatable-realtime.js')}}"></script>

      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

      @if ($errors->any())
      <script>
      document.addEventListener('DOMContentLoaded', function () {
        let errorMessages = '';
        @foreach ($errors->all() as $error)
      errorMessages += '{{ $error }}<br>';
    @endforeach
        Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        html: errorMessages,
        showConfirmButton: true
        });
      });
      </script>
    @endif

      @if (session('success'))
      <script>
      document.addEventListener('DOMContentLoaded', function () {
        Swal.fire({
        icon: 'success',
        title: 'Success',
        text: '{{ session('success') }}',
        timer: 2000,
        showConfirmButton: false
        });
      });
      </script>
    @endif

      @if (session('error'))
      <script>
      document.addEventListener('DOMContentLoaded', function () {
        Swal.fire({
        icon: 'error',
        title: 'Error',
        text: '{{ session('error') }}',
        showConfirmButton: true
        });
      });
      </script>
    @endif

      @stack('datatable-scripts')
@yield('scripts')
<script src="{{asset('js/form-navigation.js')}}"></script>

<!-- Dark mode toggle script -->
<script>
(function() {
  var btn = document.getElementById('darkModeToggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mibook-theme', next);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem('mibook-theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
})();
</script>

<!-- CSV Export function -->
<script>
window.exportTableCSV = function(tableId) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var headers = [];
  var headerCells = table.querySelectorAll('thead th');
  headerCells.forEach(function(th) {
    var txt = th.textContent.trim();
    if (txt && txt.toLowerCase() !== 'action' && txt.toLowerCase() !== 'actions') {
      headers.push(txt);
    }
  });
  var rows = table.querySelectorAll('tbody tr');
  var csv = headers.join(',') + '\n';
  rows.forEach(function(row) {
    var cells = row.querySelectorAll('td');
    var vals = [];
    for (var i = 0; i < headers.length && i < cells.length; i++) {
      var val = cells[i].textContent.trim().replace(/,/g, ' ').replace(/"/g, "'");
      vals.push('"' + val + '"');
    }
    csv += vals.join(',') + '\n';
  });
  var blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = tableId + '_export_' + new Date().toISOString().slice(0,10) + '.csv';
  link.click();
};
</script>

<!-- Active sidebar tracking -->
<script>
$(document).ready(function () {
  var activeClass = localStorage.getItem('activeClass');
  if (activeClass) {
    $('ul li').removeClass('active');
    $('.' + activeClass).addClass('active');
  } else {
    $('.dashboard_home_li').addClass('active');
  }

  $('.dashboard_home_li,.dashboard_li,.backup-emails_li, .Campanies_li, .Company_Assignments_li, .Website_Setting_li, .Partners_li, .Transactions_li, .Users_li, .User_Company_Access_li').on('click', function () {
    $('ul li').removeClass('active');
    $(this).addClass('active');
    var clickedClass = $(this).attr('class').split(' ')[0];
    localStorage.setItem('activeClass', clickedClass);
  });
});
</script>

<!-- Sidebar toggle -->
<script>
$(document).ready(function() {
  var $wrapper = $('.page-wrapper');
  var $overlay = $('#sidebar-overlay');
  
  $('#toggle-sidebar, .toggle-sidebar').on('click', function(e) {
    e.preventDefault();
    $wrapper.toggleClass('toggled');
    if (window.innerWidth < 992) {
      $overlay.toggleClass('active', $wrapper.hasClass('toggled'));
    }
  });
  
  $overlay.on('click', function() {
    $wrapper.removeClass('toggled');
    $overlay.removeClass('active');
  });
  
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $wrapper.hasClass('toggled') && window.innerWidth < 992) {
      $wrapper.removeClass('toggled');
      $overlay.removeClass('active');
    }
  });
  
  $(window).on('resize', function() {
    if (window.innerWidth >= 992) {
      $overlay.removeClass('active');
    } else {
      if ($wrapper.hasClass('toggled')) {
        $overlay.addClass('active');
      }
    }
  });
});
</script>

<!-- Mobile Card View -->
<script>
$(document).ready(function() {
  function applyCardLabels() {
    $('table.dataTable, table.table').each(function() {
      var $table = $(this);
      $table.addClass('table-card-mobile');
      var headers = [];
      $table.find('thead th').each(function() {
        headers.push($(this).text().trim());
      });
      $table.find('tbody tr').each(function() {
        $(this).find('td').each(function(idx) {
          if (headers[idx]) {
            $(this).attr('data-label', headers[idx]);
          }
        });
      });
    });
  }
  
  $(document).on('draw.dt', function() {
    applyCardLabels();
  });
  
  setTimeout(applyCardLabels, 1000);
  setTimeout(applyCardLabels, 3000);
});
</script>

<!-- Skeleton loader helper: show skeleton while table loads -->
<script>
window.showTableSkeleton = function(containerId) {
  var el = document.getElementById(containerId);
  if (el) el.style.display = 'block';
};
window.hideTableSkeleton = function(containerId) {
  var el = document.getElementById(containerId);
  if (el) el.style.display = 'none';
};
</script>

</body>

</html>

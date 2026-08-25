@props([
    'title',
    'buttonText' => null,
    'buttonModal' => null,
    'buttonIcon' => null,
])

<link rel="stylesheet" href="{{ asset('assets_admin/css/view-employee.css') }}">
<link rel="stylesheet" href="{{ asset('assets_admin/css/requests.css') }}">
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.21/css/jquery.dataTables.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

<div class="row">
    <div class="col-sm-12 col-12">
        <div class="card">
            <div class="card-body">
                <div class="card-title btns-back-edit">
                    <h5 class="emp-del-title">{{ $title }}</h5>
                    @if($buttonText)
                    <button type="button" class="btn btn-primary add-company" data-bs-toggle="modal" data-bs-target="#{{ $buttonModal }}">
                        @if($buttonIcon)<i class="fa {{ $buttonIcon }}"></i>@endif {{ $buttonText }}
                    </button>
                    @endif
                </div>

                {{ $slot }}
            </div>
        </div>
    </div>
</div>
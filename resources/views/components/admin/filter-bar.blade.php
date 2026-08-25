@props([
    'tableId' => null,
    'showExport' => true,
    'showStatusFilter' => false,
    'showDateFilter' => false,
])

<div class="premium-filter-bar">
    <div class="premium-filter-bar__left">
        {{ $slot }}
        @if($showStatusFilter)
        <select class="form-select form-select-sm premium-filter-bar__select" id="{{ $tableId }}StatusFilter" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Not Active">Inactive</option>
        </select>
        @endif
        @if($showDateFilter)
        <input type="date" class="form-control form-control-sm premium-filter-bar__date" id="{{ $tableId }}DateFrom" placeholder="From" aria-label="Date from">
        <input type="date" class="form-control form-control-sm premium-filter-bar__date" id="{{ $tableId }}DateTo" placeholder="To" aria-label="Date to">
        <button type="button" class="btn btn-sm btn-outline-secondary" id="{{ $tableId }}DateApply">Apply</button>
        @endif
    </div>
    <div class="premium-filter-bar__right">
        @if($showExport && $tableId)
        <button type="button" class="btn btn-sm btn-outline-primary premium-btn-export" onclick="exportTableCSV('{{ $tableId }}')">
            <i class="fa fa-download"></i> Export CSV
        </button>
        @endif
    </div>
</div>

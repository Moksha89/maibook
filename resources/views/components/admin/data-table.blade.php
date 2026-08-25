@props([
    'tableId',
    'ajaxUrl',
    'columns',
    'refresh' => 10000,
])

<div class="custom-tabs-container request-tab-all">
    <div class="table-responsive">
        <table id="{{ $tableId }}" class="table table-striped" style="width:100%">
            <thead>
                <tr>
                    {{ $slot }}
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

@push('datatable-scripts')
<script type="text/javascript">
(function() {
    var tbl = $('#{{ $tableId }}').DataTable({
        ajax: { url: '{{ $ajaxUrl }}', dataSrc: 'data' },
        columns: {!! $columns !!},
        order: [[0, 'asc']],
        destroy: true
    });
    setInterval(function() { tbl.ajax.reload(null, false); }, {{ $refresh }});
    window['{{ $tableId }}Table'] = tbl;
})();
</script>
@endpush
/**
 * Shared DataTable AJAX + real-time polling helper.
 * Usage: var tbl = initRealtimeTable(tableId, '/api/endpoint', columnsArray, 10000);
 */
function initRealtimeTable(tableId, ajaxUrl, columns, refreshMs) {
    refreshMs = refreshMs || 10000;
    var tbl = $('#' + tableId).DataTable({
        ajax: { url: ajaxUrl, dataSrc: "data" },
        columns: columns,
        order: [[0, "asc"]],
        destroy: true
    });
    setInterval(function() { tbl.ajax.reload(null, false); }, refreshMs);
    return tbl;
}

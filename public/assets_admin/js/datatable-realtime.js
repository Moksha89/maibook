/**
 * Shared DataTable AJAX + real-time polling helper.
 * Usage: var tbl = initRealtimeTable(tableId, '/api/endpoint', columnsArray, 10000);
 */
function initRealtimeTable(tableId, ajaxUrl, columns, refreshMs) {
    refreshMs = refreshMs || 10000;
    var $table = $('#' + tableId);
    var tbl = $table.DataTable({
        processing: true,
        ajax: {
            url: ajaxUrl,
            dataType: 'json',
            dataSrc: 'data',
            error: function (xhr, status, error) {
                console.error('DataTable request failed:', status, error);
                $table.closest('.table-responsive').find('.table-load-error').remove();
                $table.closest('.table-responsive').append(
                    '<div class="table-load-error" role="alert">' +
                    (xhr.status === 401
                        ? 'Your session has expired. Please sign in again.'
                        : 'Unable to load this table right now.') +
                    '</div>'
                );
            }
        },
        columns: columns,
        order: [[0, "asc"]],
        destroy: true
    });
    setInterval(function() { tbl.ajax.reload(null, false); }, refreshMs);
    return tbl;
}

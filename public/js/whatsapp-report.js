(function () {
    'use strict';

    function reportText(modal) {
        var title = modal.querySelector('.modal-title');
        var date = modal.querySelector('.report-date');
        var lines = [];

        if (title && title.textContent.trim()) {
            lines.push(title.textContent.trim().replace(/\s+/g, ' '));
        }
        if (date && date.textContent.trim()) {
            lines.push(date.textContent.trim());
        }

        modal.querySelectorAll('table').forEach(function (table) {
            var label = table.getAttribute('data-whatsapp-label');
            if (!label) {
                var heading = table.querySelector('thead th');
                label = heading ? heading.textContent.trim().replace(/\s+/g, ' ') : 'Report';
            }
            if (label) {
                lines.push('');
                lines.push(label);
            }
            table.querySelectorAll('tbody tr').forEach(function (row) {
                var cells = Array.from(row.querySelectorAll('td'))
                    .map(function (cell) { return cell.textContent.trim().replace(/\s+/g, ' '); })
                    .filter(Boolean);
                if (cells.length) {
                    lines.push(cells.join('  '));
                }
            });
        });

        return lines.join('\n');
    }

    function feedback(control, message, type) {
        var element = control.querySelector('[data-whatsapp-feedback]');
        element.className = 'small mt-2 text-' + type;
        element.textContent = message;
    }

    function clearFeedback(control) {
        var element = control.querySelector('[data-whatsapp-feedback]');
        element.className = 'small mt-2 d-none';
        element.textContent = '';
    }

    function imageData(modal) {
        var target = modal.querySelector('[data-whatsapp-capture]') || modal.querySelector('.modal-body');
        if (!target || typeof window.html2canvas !== 'function') {
            return Promise.reject(new Error('Unable to capture the report image.'));
        }
        return window.html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
        }).then(function (canvas) {
            return canvas.toDataURL('image/png');
        });
    }

    function init(control) {
        var modal = document.querySelector(control.getAttribute('data-whatsapp-report-modal'));
        var button = control.querySelector('[data-whatsapp-send]');
        var format = control.querySelector('[data-whatsapp-format]');
        var phone = control.querySelector('[data-whatsapp-phone]');
        var sendUrl = control.getAttribute('data-whatsapp-url');

        if (!modal || !button || !format || !phone || !sendUrl) {
            return;
        }

        button.addEventListener('click', function () {
            var selectedFormat = format.value;
            var payload = {
                to: phone.value.trim(),
                format: selectedFormat
            };

            if (selectedFormat === 'text' || selectedFormat === 'both') {
                payload.text = reportText(modal);
            }

            button.disabled = true;
            clearFeedback(control);

            var csrfMeta = document.querySelector('meta[name="csrf-token"]');
            if (!csrfMeta || !csrfMeta.content) {
                feedback(control, 'Unable to send the report right now.', 'danger');
                button.disabled = false;
                return;
            }

            var imagePromise = selectedFormat === 'image' || selectedFormat === 'both'
                ? imageData(modal)
                : Promise.resolve(null);

            imagePromise
                .then(function (image) {
                    if (image) {
                        payload.image = image;
                    }
                    return fetch(sendUrl, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfMeta.content
                        },
                        body: JSON.stringify(payload)
                    });
                })
                .then(function (response) {
                    return response.json().then(function (data) {
                        if (!response.ok) {
                            throw new Error(data.message || 'Unable to send the report.');
                        }
                        return data;
                    });
                })
                .then(function (data) {
                    feedback(control, data.message || 'Report sent to WhatsApp.', 'success');
                })
                .catch(function (error) {
                    feedback(control, error.message || 'Unable to send the report.', 'danger');
                })
                .finally(function () {
                    button.disabled = false;
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-whatsapp-report]').forEach(init);
    });
}());

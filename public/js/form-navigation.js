(function () {
    'use strict';

    var fieldSelector =
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):' +
        'not([type="reset"]):not([type="file"]):not([type="checkbox"]):' +
        'not([type="radio"]):not([disabled]), select:not([disabled]), ' +
        '[contenteditable="true"]';

    function isExcluded(field) {
        if (field.matches('textarea, input[type="search"]')) {
            return true;
        }

        if (field.closest('#register_entry, [data-enter-advance="off"]')) {
            return true;
        }

        return field.matches(
            '#search-input, #Name_id_name, #remarks, .search-input, ' +
            '.autocomplete-input, [autocomplete="search"]'
        );
    }

    function isFocusable(field) {
        return field.offsetWidth > 0 &&
            field.offsetHeight > 0 &&
            !field.disabled &&
            field.getAttribute('aria-hidden') !== 'true';
    }

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey ||
            event.altKey || event.metaKey) {
            return;
        }

        var field = event.target;
        if (!(field instanceof HTMLElement) || isExcluded(field)) {
            return;
        }

        var form = field.form || field.closest('form');
        if (!form) {
            return;
        }

        var fields = Array.prototype.filter.call(
            form.querySelectorAll(fieldSelector),
            function (candidate) {
                return !isExcluded(candidate) && isFocusable(candidate);
            }
        );
        var currentIndex = fields.indexOf(field);

        if (currentIndex === -1 || currentIndex === fields.length - 1) {
            return;
        }

        event.preventDefault();
        fields[currentIndex + 1].focus();
    });
})();

$(document).ready(function(){
    $('#loanParameters\\.date, #loanParameters\\.paymentDay').datepicker({
        format: 'dd.mm.yyyy',
        language: 'ru',
        todayHighlight: true,
        weekStart: 1
    });
});

$(document).ready(function(){
    $('#loanParameters\\.advancedSettings').change(function() {
        if ($(this).is(':checked')) {
            $('.advanced-settings').show();
        } else {
            $('.advanced-settings').hide();
        }
    });
});
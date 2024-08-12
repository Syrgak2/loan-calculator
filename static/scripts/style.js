$(document).ready(function(){
    $('#loanParameters\\.date').datepicker({
        format: 'yyyy.mm.dd',
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

$(document).ready(function() {
    $('#loanParameters\\.paymentType').change(function() {
        if ($(this).val() === '3') {
            $('.markup').show();
        } else {
            $('.markup').hide();
        }
    });
});
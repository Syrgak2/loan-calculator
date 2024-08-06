
$('#calculateButton').on('click', function () {
    var amount = $('#loanParameters\\.amount').val();
    var periodValue = $('#loanParameters\\.root_periodValue').val();
    var periodType = $('#loanParameters\\.root_periodType').val();
    var loanGivenDate = parseDate($('#loanParameters\\.date').val());
    var rateType = $('#loanParameters\\.rateType').val();
    var percent = parseFloat($('#percent').val());
    var percentType = $('#loanParameters\\.percentType').val();
    var paymentType = parseInt($('#loanParameters\\.paymentType').val(), 10);
    var calculationMethod = parseInt($('#loanParameters\\.calculationMethod').val(), 10);
    var paymentDate = parseInt($('#loanParameters\\.paymentDay').val(), 10);

    console.log("Hre")
    console.log(paymentDate)


    if (paymentType === 2) {
        generateTableRows(generateDifferentialData());
    }


    function generateDifferentialData() {
    // Преобразуйте сумму в число и округлите до двух знаков после запятой
    let sum = parseFloat((amount / periodValue).toFixed(2));
    let currentLoadBalance = parseFloat(amount);
    let oldPayDate = loanGivenDate;
    let currentPayDate = calculateNextPaymentDate(loanGivenDate);
        currentPayDate.setDate(paymentDate);
    let percentPayment;

    const data = [];

    for (let i = 0; i < periodValue; i++) {
        percentPayment = differentiatedCalculation(calculationMethod, oldPayDate, currentPayDate, currentLoadBalance, percent);
        if (i === periodValue - 1) {
            sum = currentLoadBalance;
            currentLoadBalance = 0;
        } else {
            currentLoadBalance = parseFloat((currentLoadBalance - sum).toFixed(2));
        }
        const item = {
            number: i + 1,
            date: formatDate(currentPayDate),
            sum: parseFloat((sum + percentPayment).toFixed(2)),
            repaymentPrincipalDebt: parseFloat(sum.toFixed(2)),
            percentPayment: percentPayment,
            loadBalance: currentLoadBalance,
            description: "Ежемесячный платеж за " + formatDate(currentPayDate),
        };

        data.push(item);
        console.log(sum);

        // Обновление значений для следующей итерации
        oldPayDate = currentPayDate;
        currentPayDate = calculateNextPaymentDate(currentPayDate);
    }

    return data;
}
    function generateTableRows(data) {
    const tbody = document.querySelector('#paymentCalculationTable tbody');
    tbody.innerHTML = '';

    for (const item of data) {
        const tr = document.createElement('tr');

        const tdNumber = document.createElement('td');
        tdNumber.textContent = item.number;
        tr.appendChild(tdNumber);

        const tdDate = document.createElement('td');
        tdDate.textContent = item.date;
        tr.appendChild(tdDate);

        const tdAmount = document.createElement('td');
        tdAmount.textContent = item.amount;
        tr.appendChild(tdAmount);

        const tdRepaymentPrincipalDebt = document.createElement('td');
        tdRepaymentPrincipalDebt.textContent = item.repaymentPrincipalDebt;
        tr.appendChild(tdRepaymentPrincipalDebt);

        const tdPercentPayment = document.createElement('td');
        tdPercentPayment.textContent = item.percentPayment;
        tr.appendChild(tdPercentPayment);

        const tdLoadBalance = document.createElement('td');
        tdLoadBalance.textContent = item.loadBalance;
        tr.appendChild(tdLoadBalance);

        const tdDescription = document.createElement('td');
        tdDescription.textContent = item.description;
        tr.appendChild(tdDescription);

        // Добавление строки в таблицу
        tbody.appendChild(tr);
    }
}
function differentiatedCalculation(calculationMethod, oldPayDate, currentPayDate, amount, percent) {
        let sumDate = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        let sumDateOfYear = getSumDateOfYear(calculationMethod);
        let percent_sum = parseFloat((parseFloat(amount) * (parseFloat(percent) / 100 *  parseFloat(sumDate) / sumDateOfYear)).toFixed(2))
    console.log(parseFloat(amount), parseFloat(percent),  parseFloat(sumDate), parseFloat(sumDateOfYear) )
    console.log('percent_sum' + percent_sum)
    return percent_sum
    }


function getSumDateOfYear(calculationMethod) {

    if ((calculationMethod === 2 || calculationMethod === 4) && isLeapYear()) {
        return 366;
    } else if ((calculationMethod === 2 || calculationMethod === 4) && !isLeapYear()) {
        return 365;
    } else {
        return 360;
    }
}

function getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate) {
    if (!(oldPayDate instanceof Date) || !(currentPayDate instanceof Date)) {
        throw new Error('Обе переменные должны быть объектами Date');
    }
    if (calculationMethod === 1 || calculationMethod === 4) {
        return 30;
    } else  {
        return  CalculateDateSum(oldPayDate, currentPayDate)
    }
}

function CalculateDateSum(oldPaymentDate, currentPaymentDate) {
    // Проверка, являются ли оба параметра объектами Date
    if (!(oldPaymentDate instanceof Date) || isNaN(oldPaymentDate) ||
        !(currentPaymentDate instanceof Date) || isNaN(currentPaymentDate)) {
        throw new Error('Обе переменные должны быть валидными объектами Date');
    }

    // Вычисление разницы во времени в миллисекундах
    let differenceInTime = currentPaymentDate.getTime() - oldPaymentDate.getTime();

    // Преобразование разницы из миллисекунд в дни
    return differenceInTime / (1000 * 3600 * 24);
}

function isLeapYear() {
    let year = new Date().getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function calculateNextPaymentDate(currentPayDate) {
    // Проверяем, является ли currentPayDate экземпляром Date
    if (!(currentPayDate instanceof Date) || isNaN(currentPayDate.getTime())) {
        throw new Error('Invalid date');
    }

    let nextDate = new Date(currentPayDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    return checkPayDate(nextDate);
}

function checkPayDate(payDate) {

    if (!(payDate instanceof Date)) {
        throw new Error("Both variables must be Date objects");
    }

    // Проверяем день недели
    if (payDate.getDay() === 0) {
        return addDay(payDate, 1)// Sunday
    } else if (payDate.getDay() === 6) {
        return addDay(payDate, 2)// Saturday
    } else {
        return payDate;
    }
}

    function addDay(date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    function parseDate(dateString) {
    return new Date(dateString);
}
    function formatDate(date) {
        // Format the date as needed, e.g., 'YYYY-MM-DD'
        return date.toISOString().split('T')[0];
    }
});







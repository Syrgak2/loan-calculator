import {addDays, addMonths} from "date-fns";

$('#calculateButton').on('click', function () {
    var amount = $('#loanParameters\\.amount').val();
    var periodValue = $('#loanParameters\\.root_periodValue').val();
    var periodType = $('#loanParameters\\.root_periodType').val();
    var loanGivenDate = $('#loanParameters\\.date').val();
    var rateType = $('#loanParameters\\.rateType').val();
    var percent = $('#loanParameters\\.percent').val();
    var percentType = $('#loanParameters\\.percentType').val();
    var paymentType = $('#loanParameters\\.paymentType').val();
    var calculationMethod = $('#loanParameters\\.calculationMethod').val();
    var paymentDate = $('#loanParameters\\.paymentDay').val();


    let map = new Map();

    if (paymentType === 1) {
        generateTableRows(generateDifferentialData());
    }


    function generateDifferentialData() {
        let currentLoadBalance = amount;
        let sum = (amount / periodValue).toFixed(2);
        let oldPayDate = loanGivenDate;
        let currentPayDate = paymentDate;
        let percentPayment = differentiatedCalculation(calculationMethod, oldPayDate, currentPayDate, currentLoadBalance, percent);

        const data = [];

        for (let i = 0; i < periodValue; i++) {
            const item = {
                number: i + 1,
                date: currentPayDate,
                sum: sum + percentPayment,
                repaymentPrincipalDebt: sum,
                percentPayment: percentPayment,
                loadBalance: currentLoadBalance - sum,
                description: "Ежемесячный платеж за " + currentPayDate,
        }
            data.push(item);
            currentLoadBalance =- sum;
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate);
    }
        return data;

    }
});



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
        return (amount * (percent / 100 *  sumDate / sumDateOfYear)).toFixed(2)
    }

function getSumDateOfYear(calculationMethod) {
    if (calculationMethod === 1 || calculationMethod === 3) {
        return 360;
    } else if ((calculationMethod === 2 || calculationMethod === 4) && isLeapYear()) {
        return 366;
    } else if ((calculationMethod === 2 || calculationMethod === 4) && !isLeapYear()) {
        return 365;
    }
}

function getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate) {
    if (!(oldPayDate instanceof Date) || !(currentPayDate instanceof Date)) {
        throw new Error('Обе переменные должны быть объектами Date');
    }
    if (calculationMethod === 1 || calculationMethod === 4) {
        return 30;
    } else if (calculationMethod === 2 || calculationMethod === 3) {
        return  CalculateDateSum(oldPayDate, currentPayDate)
    }
}

function CalculateDateSum(oldPaymentDate, currentPaymentDate) {
        if (!(oldPaymentDate instanceof Date) || !(currentPaymentDate instanceof Date)) {
        throw new Error('Обе переменные должны быть объектами Date');
    }

        let differenceInTime = currentPaymentDate.getTime() - oldPaymentDate.getTime();
    return differenceInTime / (1000 * 3600 * 24);
    }

function isLeapYear() {
    let year = new Date().getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function calculateNextPaymentDate(currentPayDate) {

    let nextDate = addMonths(currentPayDate, 1);

    return checkPayDate(nextDate);
}

function checkPayDate(payDate) {
    if (!payDate instanceof Date)
    if (payDate.getDay() === 0) {
        return addDays(payDate, 1);
    } else if (payDate.getDay() === 6) {
        return addDays(payDate, 2);
    } else {
        return payDate;
    }
}




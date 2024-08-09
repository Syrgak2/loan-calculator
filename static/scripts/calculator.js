
$('#calculateButton').on('click', function () {
    var amount = $('#loanParameters\\.amount').val();
    var periodValue = parseInt($('#loanParameters\\.root_periodValue').val(), 10);
    var periodType = $('#loanParameters\\.root_periodType').val();
    var loanGivenDate = parseDate($('#loanParameters\\.date').val());
    var rateType = $('#loanParameters\\.rateType').val();
    var percent = parseFloat($('#percent').val());
    var markup = parseFloat($('#loanParameters\\.markup').val());
    var percentType = $('#loanParameters\\.percentType').val();
    var paymentType = parseInt($('#loanParameters\\.paymentType').val(), 10);
    var calculationMethod = parseInt($('#loanParameters\\.calculationMethod').val(), 10);
    var paymentDate = parseInt($('#loanParameters\\.paymentDay').val(), 10);
    var creditVacation = parseInt($('#loanParameters\\.creditVacation').val(), 10);

    console.log("Hre")
    console.log(creditVacation)


    //
    if (paymentType === 2) {
        generateTableRows(generateDifferentialData(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, creditVacation));
    } else if (paymentType === 1) {
        generateTableRows(generateAnnuityData(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, creditVacation));
    } else if (paymentType === 3) {
        generateTableRows(generateAnnuityDataByIslamicPrincipal(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, markup));
    }



});


function generateDifferentialData(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, creditVacation) {
    // Преобразуйте сумму в число и округлите до двух знаков после запятой
    let sum = parseFloat((amount / periodValue).toFixed(2));
    let currentLoadBalance = parseFloat(amount);
    let oldPayDate = loanGivenDate;
    let currentPayDate = calculateNextPaymentDate(loanGivenDate, paymentDate);
    let percentPayment;
    let actualCreditVacation = creditVacation;
    let month_payment;

    let totalMonthPaymentSum = 0;
    let totalRepaymentPrincipalDebt = 0;
    let totalPercentPayment = 0;
    let description = "";

    const data = [];

    for (let i = 0; i <= periodValue; i++) {
        console.log(actualCreditVacation, creditVacation);

        // Условия которые отрабатывает при добавлени отпусков
        if (creditVacation > 0 && creditVacation > periodValue) {
            throw new Error('Отпуск не должен перевышать перюд на который брался кредит');
        }
        if (actualCreditVacation > 0) {
            sum = 0;
            actualCreditVacation = actualCreditVacation - 1;
        }

        // Обновление значений даты платежа для этой итерации если это не первая итерация
        if (i !== 0 && i !== periodValue) {
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate, paymentDate);
        }

        percentPayment = differentiatedPercentCalculation(calculationMethod, oldPayDate, currentPayDate, currentLoadBalance, percent);
        // расчитывает оплаты основного долго в последниу месяц
        // Делает так чтобы не оставалась остаток по основному долгу
        if (i === periodValue - 1) {
            sum = currentLoadBalance;
            currentLoadBalance = 0;

            month_payment = sum + percentPayment;
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percentPayment;
            totalRepaymentPrincipalDebt += sum;
        } else if (i !== periodValue){
            month_payment = sum + percentPayment;
            currentLoadBalance = parseFloat((currentLoadBalance - sum).toFixed(2));
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percentPayment;
            totalRepaymentPrincipalDebt += sum;
        }


        if (i === parseInt(periodValue)) {
            month_payment = totalMonthPaymentSum;
            sum = totalRepaymentPrincipalDebt;
            percentPayment = totalPercentPayment;
            currentLoadBalance = 0;
            description = "Итоги";
        }


        const item = {
            number: i + 1,
            date: formatDate(currentPayDate),
            sum: parseFloat(month_payment.toFixed(2)),
            repaymentPrincipalDebt: parseFloat(sum.toFixed(2)),
            percentPayment: parseFloat(percentPayment.toFixed(2)),
            loadBalance: currentLoadBalance,
            description: "Ежемесячный платеж за " + formatDate(currentPayDate),
        };

        data.push(item);
        if (creditVacation > 0 && actualCreditVacation === 0) {
            sum = parseFloat((amount / (periodValue - creditVacation)).toFixed(2))
        }

    }

    return data;
}

function generateAnnuityData(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, creditVacation ) {
    // Преобразуйте сумму в число и округлите до двух знаков после запятой
    let currentLoadBalance = parseFloat(amount);
    let oldPayDate = loanGivenDate;
    // Ставить как текуший день оплаты следиюший месяц выдачи кредита и день выброной для оплаты
    let currentPayDate = calculateNextPaymentDate(loanGivenDate, paymentDate);
    let daily_interest_rate;
    let days_in_calculation;
    let days_in_year;
    let main_sum;
    let percent_sum;
    let actualCreditVacation = creditVacation;
    let periodValueAfterVacation = periodValue - creditVacation;

    let mpr = percent / 100 / 12;

    let month_payment = parseFloat(((amount * mpr) / (1 - (1+mpr) ** (-periodValue))).toFixed(2));

    let totalMonthPaymentSum = 0;
    let totalRepaymentPrincipalDebt = 0;
    let totalPercentPayment = 0;
    let description = "";
    const data = [];

    for (let i = 0; i <= periodValue; i++) {
        // Обновление значений для этой итерации если это не первая итерация
        if (i !== 0 && i !== periodValue) {
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate, paymentDate);
        }

        description = "Ежемесячный платеж за " + formatDate(currentPayDate);
        days_in_calculation = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        days_in_year = getSumDateOfYear(calculationMethod);
        daily_interest_rate = (percent / 100) / days_in_year;

        percent_sum = parseFloat((currentLoadBalance * daily_interest_rate * days_in_calculation).toFixed(2));
        main_sum = parseFloat((month_payment - percent_sum).toFixed(2));

        // Условия которые отрабатывает при добавлени отпусков
        if (creditVacation > 0 && creditVacation > periodValue) {
            throw new Error('Отпуск не должен перевышать перюд на который брался кредит');
        }
        if (actualCreditVacation > 0) {
            main_sum = 0;
            month_payment = percent_sum + main_sum;
            actualCreditVacation -= 1;
        }

        // расчитывает оплаты основного долго в последниу месяц
        // Делает так чтобы не оставалась остаток по основному долгу
        if (i === periodValue - 1) {
            main_sum = currentLoadBalance;
            month_payment = parseFloat((parseFloat(main_sum) + parseFloat(percent_sum)).toFixed(2));

            // иоги
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percent_sum;
            totalRepaymentPrincipalDebt += main_sum;

            currentLoadBalance = 0;
        } else if (i < periodValue && i !== periodValue) {
            currentLoadBalance -= main_sum;
            // итоги
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percent_sum;
            totalRepaymentPrincipalDebt += main_sum;
        }

        if (i === parseInt(periodValue)) {
            console.log("if i === periodValue")
            month_payment = totalMonthPaymentSum.toFixed(2);
            percent_sum = totalPercentPayment.toFixed(2);
            main_sum = totalRepaymentPrincipalDebt.toFixed(2);
            currentLoadBalance = 0;
            description = "Итоги";
        }

        const item = {
            number: i + 1,
            date: formatDate(currentPayDate),
            sum: month_payment,
            repaymentPrincipalDebt: parseFloat(parseFloat(main_sum).toFixed(2)),
            percentPayment: percent_sum,
            loadBalance: parseFloat(currentLoadBalance.toFixed(2)),
            description: description,
        };

        data.push(item);

        // расчитывает ижемесячный платеж на остаток месяцев посе коникул
        if (creditVacation > 0 && actualCreditVacation === 0) {
            month_payment = parseFloat(((amount * mpr) / (1 - (1+mpr) ** (-periodValueAfterVacation))).toFixed(2));
        }
    }

    return data;
}


function generateAnnuityDataByIslamicPrincipal (amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, markup) {
    console.log("Iskafvbx")
    let currentLoadBalance = parseFloat(amount);
    let oldPayDate = loanGivenDate;
    // Ставить как текуший день оплаты следиюший месяц выдачи кредита и день выброной для оплаты
    let currentPayDate = calculateNextPaymentDate(loanGivenDate, paymentDate);
    let daily_interest_rate;
    let days_in_calculation;
    let days_in_year;
    let main_sum;
    let percent_sum;
    let totalPercent = 0;

    let mpr = percent / 100 / 12;

    let month_payment = parseFloat((amount * (mpr + (mpr / ((1 + mpr) ** periodValue - 1)))).toFixed(2));
    let creditMarcup = parseFloat((amount * (markup / 100)).toFixed(2));

    let totalMonthPaymentSum = 0;
    let totalRepaymentPrincipalDebt = 0;
    let totalPercentPayment = 0;
    let description = "";
    const data = [];


    for (let i = 0; i <= periodValue; i++) {
        // Обновление значений для этой итерации если это не первая итерация
        if (i !== 0 && i !== periodValue) {
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate, paymentDate);
        }
        description = "Ежемесячный платеж за " + formatDate(currentPayDate);
        days_in_calculation = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        days_in_year = getSumDateOfYear(calculationMethod);
        daily_interest_rate = (percent / 100) / days_in_year;

        percent_sum = parseFloat((currentLoadBalance * daily_interest_rate * days_in_calculation).toFixed(2));
        main_sum = parseFloat((month_payment - percent_sum).toFixed(2));
    
        
        // расчитывает оплаты основного долго в последний месяц
        // Делает так чтобы не оставалась остаток по основному долгу
        if (i === periodValue - 1) {
            main_sum = currentLoadBalance;

            totalPercent += percent_sum;
            if (creditMarcup > totalPercentPayment) {
                percent_sum = parseFloat((creditMarcup - totalPercentPayment).toFixed(2));
                month_payment = parseFloat((parseFloat(main_sum) + parseFloat(percent_sum)).toFixed(2));

            } else {
                percent_sum = parseFloat((totalPercentPayment - creditMarcup).toFixed(2));
                month_payment = parseFloat((parseFloat(main_sum) + parseFloat(percent_sum)).toFixed(2));

            }

            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percent_sum;
            totalRepaymentPrincipalDebt += main_sum;

            currentLoadBalance = 0;
        } else if (i < periodValue && i !== periodValue) {
            // расчитывает оплаты основного долго креме последней 
            currentLoadBalance -= main_sum;
            totalPercent += percent_sum;
            // итоги
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percent_sum;
            totalRepaymentPrincipalDebt += main_sum;
        }

        // В последней итарации проводить итоги
        if (i === parseInt(periodValue)) {
            console.log("if i === periodValue")
            month_payment = totalMonthPaymentSum.toFixed(2);
            percent_sum = totalPercentPayment.toFixed(2);
            main_sum = totalRepaymentPrincipalDebt.toFixed(2);
            currentLoadBalance = 0;
            description = "Итоги";
        }

        const item = {
            number: i + 1,
            date: formatDate(currentPayDate),
            sum: month_payment,
            repaymentPrincipalDebt: parseFloat(parseFloat(main_sum).toFixed(2)),
            percentPayment: percent_sum,
            loadBalance: parseFloat(currentLoadBalance.toFixed(2)),
            description: description,
        };

        data.push(item);
    }
    return data;
}


// Функция для генерации таблицы
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

        const tdSum = document.createElement('td');
        tdSum.textContent = item.sum;
        tr.appendChild(tdSum);

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





// Проценты для дифференцированного расчета
function differentiatedPercentCalculation(calculationMethod, oldPayDate, currentPayDate, amount, percent) {
        let sumDate = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        let sumDateOfYear = getSumDateOfYear(calculationMethod);
    return parseFloat((parseFloat(amount) * (parseFloat(percent) / 100 * parseFloat(sumDate) / sumDateOfYear)).toFixed(2))
}


//  id 1 = 30/360
// id 2 = факт/факт
// id 3 = факт/360
// id 4 = 30/факт
// получает метод расчета и дату для который нужно расчитать и возврошяет количество дней в году в переданной дате
function getSumDateOfYear(calculationMethod, date) {

    if ((calculationMethod === 2 || calculationMethod === 4) && isLeapYear(date)) {
        return 366;
    } else if ((calculationMethod === 2 || calculationMethod === 4) && !isLeapYear(date)) {
        return 365;
    } else {
        return 360;
    }
}

//  id 1 = 30/360
// id 2 = факт/факт
// id 3 = факт/360
// id 4 = 30/факт
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

// Возврошяет количество дней между oldPaymnetDate и currentPaymentDate
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

// проверяет является ли год висакосным
function isLeapYear(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    let year = new Date(date).getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Вычесляет следубший дату оплаты
function calculateNextPaymentDate(currentPayDate, paymentDate) {
    // Проверяем, является ли currentPayDate экземпляром Date
    if (!(currentPayDate instanceof Date) || isNaN(currentPayDate.getTime())) {
        throw new Error('Invalid date');
    }

    console.log(checkDayInMonth(currentPayDate, paymentDate))
    if (checkDayInMonth(currentPayDate, paymentDate)) {
        let nextDate = new Date(currentPayDate);
        nextDate.setMonth(currentPayDate.getMonth() + 1);
        nextDate.setDate(paymentDate);
        return checkPayDate(nextDate);
    } else {
        let nextDate = new Date(currentPayDate);
        nextDate.setMonth(currentPayDate.getMonth() + 1); // Переход на месяц вперёд
        nextDate.setDate(30); // Устанавливаем дату на 0, чтобы получить последний день предыдущего месяца
        return checkPayDate(nextDate)
    }
}

// Проверяет, существует ли день в следующем месяце
function checkDayInMonth(currentDate, day) {
    let date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);

    // Если день превышает количество дней в следующем месяце,
    // то дата перейдёт на следующий месяц, так что проверяем это.
    return date.getDate() === day && date.getMonth() === (currentDate.getMonth() + 1) % 12;
}

// Проеверяет, не является ли выбранный день субботой или воскреснеие
function checkPayDate(payDate) {

    // Проверяем день недели
    if (payDate.getDay() === 0) {
        // sunday
        return addDay(payDate, 1);
    } else if (payDate.getDay() === 6) {
        // Saturday
        return addDay(payDate, 2);
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
    if (!(date instanceof Date) || isNaN(date)) {
        throw new Error('Параметр должен быть валидным объектом Date');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript начинаются с 0
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
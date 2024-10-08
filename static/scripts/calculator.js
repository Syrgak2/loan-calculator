
$('#calculateButton').on('click', function () {
    var amount = parseFloat($('#loanParameters\\.amount').val().replace(/\s/g, '').replace(/,/g, ''));
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
    console.log(amount, typeof amount)
    console.log(percent)


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
    // Преобразуйте сумму в число и округлите до двух знаков после запятой.
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

        // Условия, которые срабатывают при добавлении отпусков.
        if (creditVacation > 0 && creditVacation > periodValue) {
            throw new Error('Отпуск не должен перевышать перюд на который брался кредит');
        }
        if (actualCreditVacation > 0) {
            sum = 0;
            actualCreditVacation = actualCreditVacation - 1;
        }

        // Обновление значений даты платежа для этой итерации, если это не первая итерация.
        if (i !== 0 && i !== periodValue) {
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate, paymentDate);
        }

        percentPayment = differentiatedPercentCalculation(calculationMethod, oldPayDate, currentPayDate, currentLoadBalance, percent);
        // Рассчитывает оплату основного долга в последний месяц.
        // Делает так, чтобы не оставался остаток по основному долгу.
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

        // Обновление значений для итогов.
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
        // В конце кредитных каникул рассчитывает выплаты по основному долгу за оставшиеся месяцы.
        if (creditVacation > 0 && actualCreditVacation === 0) {
            sum = parseFloat((amount / (periodValue - creditVacation)).toFixed(2))
        }

    }

    return data;
}

function generateAnnuityData(amount, periodValue, loanGivenDate, paymentDate, calculationMethod, percent, creditVacation ) {
    // Преобразуйте сумму в число и округлите до двух знаков после запятой
    let currentLoadBalance = amount;
    let oldPayDate = loanGivenDate;
    // Устанавливает следующий месяц после выдачи кредита и выбранный день оплаты как текущий день оплаты.
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
    console.log("month_payment", month_payment)

    let totalMonthPaymentSum = 0;
    let totalRepaymentPrincipalDebt = 0;
    let totalPercentPayment = 0;
    let description = "";
    const data = [];

    for (let i = 0; i <= periodValue; i++) {
       // Обновление значений для этой итерации, если это не первая итерация.
        if (i !== 0 && i !== periodValue) {
            oldPayDate = currentPayDate;
            currentPayDate = calculateNextPaymentDate(currentPayDate, paymentDate);
        }

        description = "Ежемесячный платеж за " + formatDate(currentPayDate);
        days_in_calculation = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        days_in_year = getSumDateOfYear(calculationMethod);
        daily_interest_rate = (percent / 100) / days_in_year;

        percent_sum = parseFloat((currentLoadBalance * daily_interest_rate * parseFloat(days_in_calculation)).toFixed(2));
        main_sum = parseFloat((month_payment - percent_sum).toFixed(2));

        // Условия, которые срабатывают при добавлении отпусков.
        if (creditVacation > 0 && creditVacation > periodValue) {
            throw new Error('Отпуск не должен перевышать перюд на который брался кредит');
        } else if (actualCreditVacation > 0) {
            main_sum = 0;
            month_payment = percent_sum + main_sum;
            actualCreditVacation -= 1;
        }


        // Рассчитывает оплату основного долга в последний месяц.
        // Делает так, чтобы не оставался остаток по основному долгу.
        if (i === periodValue - 1) {
            main_sum = parseFloat(currentLoadBalance.toFixed(2));
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

        console.log(month_payment)
        console.log(main_sum)
        console.log(currentLoadBalance)
        console.log(percent_sum)

        const item = {
            number: i + 1,
            date: formatDate(currentPayDate),
            sum: parseFloat(month_payment),
            repaymentPrincipalDebt: parseFloat(main_sum),
            percentPayment: parseFloat(percent_sum),
            loadBalance: parseFloat(currentLoadBalance.toFixed(2)),
            description: description,
        };

        data.push(item);

        // Рассчитывает ежемесячный платеж на оставшиеся месяцы после каникул.
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
    // Устанавливает текущий день оплаты как следующий месяц после выдачи кредита и выбранный день оплаты.
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
    
        
        // Рассчитывает оплату основного долга в последний месяц.
        // Обеспечивает отсутствие остатка по основному долгу.
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
            // Рассчитывает оплату основного долга, кроме последней.
            currentLoadBalance -= main_sum;
            totalPercent += percent_sum;
            // итоги
            totalMonthPaymentSum += month_payment;
            totalPercentPayment += percent_sum;
            totalRepaymentPrincipalDebt += main_sum;
        }

        // В последней итерации проводить итоги.
        if (i === parseInt(periodValue)) {
            console.log("if i === periodValue")
            month_payment = parseFloat(totalMonthPaymentSum.toFixed(2));
            percent_sum = parseFloat(totalPercentPayment.toFixed(2));
            main_sum = parseFloat(totalRepaymentPrincipalDebt.toFixed(2));
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


// Функция для генерации таблицы.
function generateTableRows(data) {
    const tbody = document.querySelector('#paymentCalculationTable tbody');
    tbody.innerHTML = '';
    print(data)

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





// Проценты для дифференцированного расчета.
function differentiatedPercentCalculation(calculationMethod, oldPayDate, currentPayDate, amount, percent) {
        let sumDate = getSumOfDatesPayment(calculationMethod, oldPayDate, currentPayDate);
        let sumDateOfYear = getSumDateOfYear(calculationMethod);
    return parseFloat((parseFloat(amount) * (parseFloat(percent) / 100 * parseFloat(sumDate) / sumDateOfYear)).toFixed(2))
}


//  id 1 = 30/360
// id 2 = факт/факт
// id 3 = факт/360
// id 4 = 30/факт
// Получает метод расчета и дату, для которой нужно провести расчет, и возвращает количество дней в году на переданную дату.
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

// Возвращает количество дней между `oldPaymentDate` и `currentPaymentDate`.
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

// Проверяет, является ли год високосным.
function isLeapYear(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    let year = new Date(date).getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Вычисляет следующую дату оплаты.
function calculateNextPaymentDate(currentPayDate, paymentDate) {
    // Проверяем, является ли currentPayDate экземпляром Date
    if (!(currentPayDate instanceof Date) || isNaN(currentPayDate.getTime())) {
        throw new Error('Invalid date');
    }

    if (paymentDate === 31 || (currentPayDate.getMonth() === 0 && paymentDate >= 28)) {
        let nextDate = new Date(currentPayDate.getFullYear(), currentPayDate.getMonth() + 2, 1);
        nextDate.setDate(0);
        return checkPayDate(nextDate);
    } else {
        let nextDate = new Date(currentPayDate.getFullYear(), currentPayDate.getMonth() + 1, paymentDate);
        return checkPayDate(nextDate);
    }

}


// Проверяет, не является ли выбранный день субботой или воскресеньем.
// Если это конец месяца, устанавливает дату на пятницу, иначе на понедельник.
function checkPayDate(payDate) {

        if (payDate.getDay() === 0) {
            if ((payDate.getMonth() === 1 && payDate.getDate() >= 27) || payDate.getDate() >= 30) {
                console.log("minus")
                return minusDay(payDate, 2);
            } else {
                console.log("add")
                return addDay(payDate, 1);
            }
        } else if (payDate.getDay() === 6) {
            if ((payDate.getMonth() === 1 && payDate.getDate() >= 27) || payDate.getDate() >= 29) {
                console.log("minus")
                return minusDay(payDate, 1);
            } else {
                console.log("add")
                return addDay(payDate, 2);
            }
        } else {
            return payDate;
        }

}

   // Функция для добавления дней до понедельника.
    function addDay(date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    // Функция для вычитания дней до пятницы.
    function minusDay(date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() - days);
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
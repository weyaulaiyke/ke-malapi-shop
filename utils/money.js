const randFormatter = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatMoney(amount) {
    return randFormatter.format(Number(amount));
}

module.exports = formatMoney;
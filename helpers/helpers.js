const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

const calculateEndTime = async (startTime, date, duration) => {
    // Tách ngày, tháng, năm
    const [day, month, year] = date.split('/');
    // Tách giờ và phút
    const [hours, minutes] = startTime.split(':');

    // Tạo đối tượng Date cho startTime
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));

    // Tính endTime bằng cách thêm duration (trong milliseconds)
    const endTime = new Date(startDate.getTime() + duration * 60 * 1000);

    const hoursVietnam = endTime.getHours();
    const minutesVietnam = endTime.getMinutes();

    const formattedMinutesVietnam = String(minutesVietnam).padStart(2, '0');
    // console.log('Phút Việt Nam (dạng 00p):', formattedMinutesVietnam);

    const endTimeVietnam = `${hoursVietnam}:${formattedMinutesVietnam}`;

    return endTimeVietnam;
}

export const autoCalculateEndDate = {
    calculateEndTime
}
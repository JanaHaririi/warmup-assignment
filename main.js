const { clear } = require("console"); // Imports the clear function from the console module.
const fs = require("fs"); // Imports the file system module to handle file operations.

function timeToSeconds (timeStr){
    //Splits the string at the space to separate the numbers from "am" or "pm"
    const [time, period] = timeStr.split(' ');
    //Splits the time part by colons and converts those strings into actual numbers.
    let [hours, minutes, seconds] = time.split(':').map(Number);
    
    if (period === 'pm' && hours !== 12) {
        hours += 12; // Converts PM hours to 24-hour format if not noon.
    }
    if (period === 'am' && hours === 12) {
        hours = 0; // Converts 12 AM to 0 hours for midnight.
    }
    return hours * 3600 + minutes * 60 + seconds; //Calculates total seconds
}

function secondsToTime (totalSeconds){
    //Divides the total seconds by 3600 and rounds down to find the total hours.
    const hours = Math.floor(totalSeconds / 3600);
    //Takes the leftover seconds (the remainder), divides by 60, and rounds down to find minutes.
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    //Uses the remainder operator to find the final remaining seconds that don't fit into a minute.
    const seconds = totalSeconds % 60;
    //Combines the numbers into a string, using padStart to make sure minutes and seconds always have two digits (like "05" instead of "5").
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}




// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    //Uses your first function to turn the start time string into total seconds.
    const startSeconds = timeToSeconds(startTime);
    //Uses the same function to turn the end time string into total seconds
    const endSeconds = timeToSeconds(endTime);
    //Subtracts the start seconds from the end seconds to find the gap between them.
    const durationSeconds = endSeconds - startSeconds;
    return secondsToTime(durationSeconds); // Converts the duration back into a readable time string.
}




// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
    //Converts the start time string into total seconds from midnight.
    const startSeconds = timeToSeconds(startTime);
    //Converts the end time string into total seconds from midnight.
    const endSeconds = timeToSeconds(endTime);
    //Sets the delivery window start at 28,800 seconds (which is 8:00 am)
    const deliveryStart = 28800;
    //Sets the delivery window end at 79,200 seconds (which is 10:00 pm).
    const deliveryEnd = 79200;
    let idleSeconds = 0; // Initializes the counter for non-delivery hours.
    if(startSeconds < deliveryStart) {
        //Calculates time spent before 8:00 am and adds it to the idle total.
        idleSeconds += Math.min(endSeconds, deliveryStart) - startSeconds;
    }
    if(endSeconds > deliveryEnd) {
        // Checks if the shift ended after 10 PM and adds that late time to idle.
        idleSeconds += endSeconds - Math.max(startSeconds, deliveryEnd);
    }
    return secondsToTime(idleSeconds); // Returns the final idle duration as a string.
}




// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
     // TODO: Implement this function
    const hmsToSeconds = (hms) => {
        //Splits the string by colons and converts each part into a number.
        const [hours, minutes, seconds] = hms.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds; // Returns the total seconds.
    };
    //Uses the helper to get the total seconds for the entire shift.
    const shiftSeconds = hmsToSeconds(shiftDuration);
    //Uses the helper to get the total seconds for the idle (non-delivery) time.
    const idleSeconds = hmsToSeconds(idleTime);
    //Subtracts the idle seconds from the shift seconds to find the active work time.
    const activeSeconds = shiftSeconds - idleSeconds;
    return secondsToTime(activeSeconds); // Converts active duration back to HH:MM:SS.
}




// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    //Defines a local helper function to turn $HH:MM:SS$ into total seconds.
    const hmsToSeconds = (hms) => {
        //Splits the string by colons and converts the parts into numbers.
        const [hours, minutes, seconds] = hms.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds; // Returns total seconds.
    };
    //Converts the provided active time into seconds for comparison.
    const activeSeconds = hmsToSeconds(activeTime);

    let requiredSecond; // Variable for the target quota in seconds.
    if(date >= '2025-04-10' && date <= '2025-04-30') { // Check if date is within April holidays.
        requiredSecond = 6*3600; // Requirement is 6 hours during this period.
    }else{
        requiredSecond = (8*3600) + (24*60); // Standard requirement is 8 hours and 24 minutes.
    }
    return activeSeconds >= requiredSecond; // Returns true if the quota was met.
}




// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
    //Reads the entire text file and converts it into a string we can read.
    const data = fs.readFileSync(textFile, 'utf-8');
    //Splits the file into individual lines and removes any empty or blank lines.
    const lines = data.split("\n").filter(line => line.trim() !== "");
    const header = lines [0]; // Saves the CSV header line.
    const records = lines.slice(1); // Groups the rest as individual data rows.

    const duplicate = records.some(line => { // Searches for an existing entry.
        const columns = line.split(","); // Splits current record by comma.
        return columns[0] === shiftObj.driverID && columns[2] === shiftObj.date; // Matches ID and Date.
    });

    if(duplicate) {
        return {}; // Returns an empty object if driver already worked on this date.
    }
    const duration = getShiftDuration(shiftObj.startTime, shiftObj.endTime); // Calculates shift length.
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime); // Calculates time outside window.
    const activeTime = getActiveTime(duration, idleTime); // Calculates total active delivery time.
    const quota = metQuota(shiftObj.date, activeTime); // Checks if quota was met.

    const newEntry = { // Construct the complete entry object.
        ...shiftObj, // Spreads input properties.
        shiftDuration: duration, // Adds duration string.
        idleTime: idleTime, // Adds idle time string.
        activeTime: activeTime, // Adds active time string.
        metQuota: quota, // Adds quota boolean.
        hasBonus: false // Initializes bonus status as false.
    };

    const newLine = `${newEntry.driverID},${newEntry.driverName},${newEntry.date},${newEntry.startTime},${newEntry.endTime},${newEntry.shiftDuration},${newEntry.idleTime},${newEntry.activeTime},${newEntry.metQuota},${newEntry.hasBonus}`; // Builds CSV line.
    let lastIndex = -1; // Position of driver's last shift.
    for (let i=0; i<records.length; i++) { // Iterates through file records.
        if (records[i].startsWith(shiftObj.driverID)) { // Check if line belongs to this driver.
            lastIndex = i; // Store index.
        }
    }  
    
    if (lastIndex !== -1) {
        records.splice(lastIndex + 1, 0, newLine); // Inserts record after the driver's last entry.
    } else {
        records.push(newLine); // Appends to end of file if it's the driver's first record.
    }

    const updatedData = [header, ...records].join("\n") + "\n"; // Joins everything back with newlines.
    fs.writeFileSync(textFile, updatedData); // Updates the physical file.

    return newEntry; // Returns the entry that was added.
}




// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, 'utf-8'); // Reads the file.
    const lines = data.split("\n"); // Converts to array of lines.

    for (let i=1; i<lines.length; i++) { // Loops through data rows.
        const columns = lines[i].split(","); // Splits CSV data.
        if (columns[0] === driverID && columns[2] === date) { // Matches ID and specific date.
            columns[9] = newValue.toString(); // Updates the bonus column (index 9).
            lines[i] = columns.join(","); // Rejoins the row.
            break; // Exits loop after update.
        }
    }

    const updatedData = lines.join("\n"); // Joins all lines.
    fs.writeFileSync(textFile, updatedData); // Saves changes to file.
}




// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, 'utf-8'); // Reads file content.
    const lines = data.split("\n").filter(line => line.trim() !== ""); // Removes blank lines.
    const records = lines.slice(1); // Skips header.

    const targetMonth = parseInt(month, 10); // Converts month to number.

    let bonusCount = 0; // Bonus tally.
    let driverFound = false; // Existence flag.

    for (const line of records) { // Loops through records.
        const columns = line.split(","); // Splits CSV row.
        const currentDriverID = columns[0]; // Driver ID.
        const dateString = columns[2]; // Date.
        const hasBonus = columns[9] === "true"; // Bonus status.

        if (currentDriverID === driverID) { // Matches target driver.
            driverFound = true; // Updates flag.

            const currentMonth = parseInt(dateString.split("-")[1], 10); // Parses month from string.
            if (currentMonth === targetMonth && hasBonus) { // Matches month and bonus status.
                bonusCount++; // Increments tally.
            }
        }
    }

    return driverFound ? bonusCount : -1; // Returns result or -1 if driver doesn't exist.
}




// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, 'utf-8'); // Reads file.
    const lines = data.split("\n").filter(line => line.trim() !== ""); // Filters blanks.
    const records = lines.slice(1); // Removes header.

    let totalActiveSeconds = 0; // Total seconds counter.
    const targetMonth = parseInt(month, 10); // Normalizes month.

    for (const line of records) { // Processes records.
        const columns = line.split(","); // Splits row.
        const currentDriverID = columns[0]; // ID check.
        const dateString = columns[2]; // Date check.
        const activeTime = columns[7]; // Active time column.

        const currentMonth = parseInt(dateString.split("-")[1], 10); // Gets month.
        if (currentDriverID === driverID && currentMonth === targetMonth) { // Matches criteria.
            const [hours, minutes, seconds] = activeTime.split(":").map(Number); // Parses HMS.
            totalActiveSeconds += hours * 3600 + minutes * 60 + seconds; // Adds to sum.
        }
    }

const hours = Math.floor(totalActiveSeconds / 3600); // Extracts hours.
const minutes = Math.floor((totalActiveSeconds % 3600) / 60); // Extracts minutes.
const seconds = totalActiveSeconds % 60; // Extracts seconds.

return `${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; // Returns formatted HHH:MM:SS.
}




// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    const rateData = fs.readFileSync(rateFile, 'utf-8').split("\n"); // Reads rate rules.
    let dayOff = ""; // Driver's weekly off day.
    for (const line of rateData) { // Finds specific driver info.
        const columns = line.split(","); // Splits row.
        if (columns[0] === driverID) { // Matches ID.
            dayOff = columns[1].trim(); // Assigns day off.
            break; // Exits search.
        }
    }

    let totalRequiredSeconds = 0; // Requirement tally.
    const year = 2025; // Target year.
    const daysInMonth = new Date(year, month, 0).getDate(); // Gets total days in month.

    for (let day = 1; day <= daysInMonth; day++) { // Loops through the month.
        const dateObj = new Date(year, month - 1, day); // Current day object.
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }); // Weekday name.
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Formatted date.
        
        if (dayName !== dayOff){ // Skips day if it's the driver's day off.
            if (dateStr >= '2025-04-10' && dateStr <= '2025-04-30') { // Check for holiday period.
                totalRequiredSeconds += 6*3600; // Requirement is 6 hours.
            } else {
                totalRequiredSeconds += 8*3600 + 24*60; // Standard requirement is 8h 24m.
            }
        }
    }
    totalRequiredSeconds -= (bonusCount* 2 * 3600); // Subtracts 2 hours for every bonus earned.

    const hours = Math.floor(totalRequiredSeconds / 3600); // Total hours.
    const minutes = Math.floor((totalRequiredSeconds % 3600) / 60); // Total minutes.
    const seconds = totalRequiredSeconds % 60; // Total seconds.
    return `${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; // Returns HHH:MM:SS.
} 




// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    const rateData = fs.readFileSync(rateFile, 'utf-8').split("\n"); // Loads driver rate data.
    let basePay = 0; // Driver salary.
    let tier = 0; // Driver level.

    for (const line of rateData) { // Finds target driver details.
        const columns = line.split(","); // Splits CSV data.
        if (columns[0] === driverID) { // Matches ID.
            basePay = parseInt(columns[2]); // Sets base pay.
            tier = parseInt(columns[3]); // Sets tier.
            break; // Exits loop.
        }
    }

    const hmsToSeconds = (str) => { // Local converter for HHH:MM:SS.
        const [hours, minutes, seconds] = str.split(":").map(Number); // Parses parts.
        return hours * 3600 + minutes * 60 + seconds; // Returns total seconds.
    };

    const actualSeconds = hmsToSeconds(actualHours); // Worked seconds.
    const requiredSeconds = hmsToSeconds(requiredHours); // Required seconds.

    if (actualSeconds >= requiredSeconds) { // If criteria met...
        return basePay; // Return full salary.
    }
    
    let missingSeconds = requiredSeconds - actualSeconds; // Calculation of gap.
    let missingHours = missingSeconds / 3600; // Gap in decimal hours.

    const allowances = { 1: 50, 2: 20, 3: 10, 4: 3 }; // Tier-based hour exemptions.
    let billableMissingHours = Math.max(0, missingHours - allowances[tier]); // Subtracts allowance.

    billableMissingHours = Math.floor(billableMissingHours); // Rounds down to billable units.

    const deductionRatePerHour = Math.floor(basePay / 185); // Deduction per hour.
    const salaryDeduction = billableMissingHours * deductionRatePerHour; // Total deduction amount.
    return basePay - salaryDeduction; // Net salary after deductions.
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
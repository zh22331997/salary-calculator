// ====== 常量定義 ======
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MESSAGES = {
    NEGATIVE_VALUE_ERROR: "數值不能是負數！",
    DAY_LIMIT_ERROR: "假別（天）不能超過 1 天！",
    HOUR_LIMIT_ERROR: "每格最多填寫 8 小時！",
    MULTI_DAY_LEAVE_ERROR: "同一天不能同時勾選多種假別的天數！",
    FULL_ATTENDANCE_LOST: " (沒有全勤了⚠️)",
    MENSTRUAL_OVER_LIMIT: "(超過額度⚠️)", 
    COPY_SUCCESS: "✅ 已複製！",
    COPY_FAIL: "⚠️ 複製失敗，請手動選取內容！",
    IMPORT_SUCCESS: "假別統計結果已匯入不計薪計算！"
};

// ====== 全局變數用於儲存記錄，以便匯入 ======
let leaveRecords = [];
let sickRecords = [];
let lateRecords = [];
let lateNoDeductRecords = [];
let punchCardMissRecords = [];
let menstrualRecords = [];
let vacationRecords = [];
let funeralRecords = [];
let overtimeRecords = [];

// ====== 輔助函數 ======
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => {
        toast.style.opacity = 0;
    }, 2000);
}

function getChineseWeekday(dateStr) {
    const [month, day] = dateStr.split("/").map(Number);
    const year = parseInt(document.getElementById("yearInput").value);
    const date = new Date(year, month - 1, day);
    return `(${WEEK_DAYS[date.getDay()]})`;
}

function validateInput(input) {
    let value = parseFloat(input.value);

    // 檢查是否為有效數字，如果不是，則清空並返回
    if (isNaN(value)) {
        input.value = '';
        return;
    }

    if (value < 0) {
        showToast(MESSAGES.NEGATIVE_VALUE_ERROR);
        input.value = 0;
        return;
    }
    const dataType = input.getAttribute("data-type");
    if (dataType && dataType.includes("day") && value > 1) { // 確保 dataType 存在
        showToast(MESSAGES.DAY_LIMIT_ERROR);
        input.value = 1;
    }
    if (dataType && dataType.includes("hour") && value > 8) { // 確保 dataType 存在
        showToast(MESSAGES.HOUR_LIMIT_ERROR);
        input.value = 8;
    }
}

function getValue(id) {
    const val = parseFloat(document.getElementById(id).value);
    return isNaN(val) ? 0 : val;
}

// ====== 主要邏輯函數 ======

// 假別天數防呆檢查函數
function checkLeaveDayConflict(currentCheckbox) {
    const currentRow = currentCheckbox.closest('tr');
    const dayTypeCheckboxes = currentRow.querySelectorAll('input[type="checkbox"][data-type$="-day"]');
    const otherInputsInRow = currentRow.querySelectorAll('input[type="number"], input[name="punch-card-miss"]');

    let checkedDayCount = 0;
    dayTypeCheckboxes.forEach(checkbox => {
        if (checkbox) { // 確保 checkbox 存在
            if (checkbox.checked) {
                checkedDayCount++;
            }
        }
    });

    if (checkedDayCount > 1) {
        showToast(MESSAGES.MULTI_DAY_LEAVE_ERROR);
        currentCheckbox.checked = false; // 取消當前勾選
    } else if (checkedDayCount === 1 && currentCheckbox.checked) {
        // 如果只勾選了一個「天數」假別，則禁用並清空其他所有欄位
        otherInputsInRow.forEach(input => {
            if (input && input !== currentCheckbox) { // 確保 input 存在且不是當前被勾選的 checkbox
                input.disabled = true;
                if (input.type === 'number') {
                    input.value = '';
                } else if (input.type === 'checkbox') {
                    input.checked = false;
                }
            }
        });
    } else {
        // 如果沒有任何「天數」假別被勾選 (或者取消勾選了唯一的那個)，則啟用所有其他欄位
        otherInputsInRow.forEach(input => {
            if (input) { // 確保 input 存在
                input.disabled = false;
            }
        });
    }
    calculateLeave(); // 重新計算
}

function generateTable() {
    const year = parseInt(document.getElementById("yearInput").value);
    const month = parseInt(document.getElementById("monthInput").value);
    const daysInMonth = new Date(year, month, 0).getDate();

    let html = '<table><tr><th>日期</th><th>星期</th><th>特休<br>補休<br>(天)</th><th>特休<br>補休<br>(時)</th><th>事假<br>(天)</th><th>事假<br>(時)</th><th>病假<br>(天)</th><th>病假<br>(時)</th><th>遲到扣<br>(分鐘)</th><th>遲到三次五分鐘內<br>(分鐘)</th><th id="punchCardMissColumn">漏打卡</th><th>生理假<br>(時)</th><th>喪假<br>(天)</th><th>喪假<br>(時)</th><th>超時<br>(時)</th></tr>';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const displayDate = `${month}/${day}`;
        const dayOfWeek = date.getDay();

        let weekendClass = "";
        if (dayOfWeek === 6) weekendClass = "saturday";
        else if (dayOfWeek === 0) weekendClass = "sunday";

        html += `<tr class="weekend-row ${weekendClass}">
            <td>${displayDate}</td>
            <td>(${WEEK_DAYS[dayOfWeek]})</td>
            <td><input type="checkbox" name="leave-v" data-type="v-day" value="1"></td>
            <td><input type="number" name="leave-v" data-type="v-hour"></td>
            <td><input type="checkbox" name="leave-p" data-type="p-day" value="1"></td>
            <td><input type="number" name="leave-p" data-type="p-hour"></td>
            <td><input type="checkbox" name="leave-s" data-type="s-day" value="1"></td>
            <td><input type="number" name="leave-s" data-type="s-hour"></td>
            <td><input type="number" name="late" data-type="late-min"></td>
            <td><input type="number" name="late-no-deduct" data-type="late-no-deduct-min"></td>
            <td>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="punch-card-miss" data-type="punch-in" data-date="${displayDate}">上班</label>
                    <label><input type="checkbox" name="punch-card-miss" data-type="punch-out" data-date="${displayDate}">下班</label>
                </div>
            </td>
            <td><input type="number" name="leave-m" data-type="m-hour"></td>
            <td><input type="checkbox" name="leave-f" data-type="f-day" value="1"></td>
            <td><input type="number" name="leave-f" data-type="f-hour"></td>
            <td><input type="number" name="overtime" data-type="overtime-hour"></td>
        </tr>`;
    }

    html += '</table>';
    document.getElementById("formArea").innerHTML = html;
    document.getElementById("resultsLeave").innerText = '';
    
    // 在表格生成後，為所有動態產生的輸入框和複選框綁定事件
    const rows = document.querySelectorAll("#formArea table tr:not(:first-child)");
    rows.forEach(row => {
        row.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                checkLeaveDayConflict(this);
            });
        });
        row.querySelectorAll("input[type='number']").forEach(input => {
            input.addEventListener('input', function() {
                validateInput(this);
                calculateLeave();
            });
        });
    });

    calculateLeave(); // 產生表格後自動計算
}

function calculateLeave() {
    const rows = document.querySelectorAll("#formArea table tr:not(:first-child)");
    
    // 清空記錄，避免重複累積
    leaveRecords = [];
    sickRecords = [];
    lateRecords = [];
    lateNoDeductRecords = [];
    punchCardMissRecords = [];
    menstrualRecords = [];
    vacationRecords = [];
    funeralRecords = [];
    overtimeRecords = [];
    
    let vDay = 0, vHour = 0, pDay = 0, pHour = 0, sDay = 0, sHour = 0, lateMin = 0, lateNoDeductMin = 0;
    let punchInCount = 0, punchOutCount = 0;
    let mHour = 0;
    let fDay = 0, fHour = 0;
    let otHour = 0;
    
    rows.forEach(row => {
        const date = row.querySelector("td:first-child").innerText;
        
        const vDayChecked = row.querySelector("input[data-type='v-day']").checked ? 1 : 0;
        const vHourInput = row.querySelector("input[data-type='v-hour']");
        const vHourVal = vHourInput.disabled ? 0 : (parseFloat(vHourInput.value) || 0);

        const pDayChecked = row.querySelector("input[data-type='p-day']").checked ? 1 : 0;
        const pHourInput = row.querySelector("input[data-type='p-hour']");
        const pHourVal = pHourInput.disabled ? 0 : (parseFloat(pHourInput.value) || 0);

        const sDayChecked = row.querySelector("input[data-type='s-day']").checked ? 1 : 0;
        const sHourInput = row.querySelector("input[data-type='s-hour']");
        const sHourVal = sHourInput.disabled ? 0 : (parseFloat(sHourInput.value) || 0);

        const lateMinInput = row.querySelector("input[data-type='late-min']");
        const lateMinVal = lateMinInput.disabled ? 0 : (parseFloat(lateMinInput.value) || 0);

        const lateNoDeductMinInput = row.querySelector("input[data-type='late-no-deduct-min']");
        const lateNoDeductMinVal = lateNoDeductMinInput.disabled ? 0 : (parseFloat(lateNoDeductMinInput.value) || 0);

        const punchCardMissCheckboxes = row.querySelectorAll("input[type='checkbox'][name='punch-card-miss']");
        const punchInVal = punchCardMissCheckboxes[0].disabled ? false : punchCardMissCheckboxes[0].checked;
        const punchOutVal = punchCardMissCheckboxes[1].disabled ? false : punchCardMissCheckboxes[1].checked;

        const mHourInput = row.querySelector("input[data-type='m-hour']");
        const mHourVal = mHourInput.disabled ? 0 : (parseFloat(mHourInput.value) || 0);
        
        const fDayChecked = row.querySelector("input[data-type='f-day']").checked ? 1 : 0;
        const fHourInput = row.querySelector("input[data-type='f-hour']");
        const fHourVal = fHourInput.disabled ? 0 : (parseFloat(fHourInput.value) || 0);

        const otHourInput = row.querySelector("input[data-type='overtime-hour']");
        const otHourVal = otHourInput.disabled ? 0 : (parseFloat(otHourInput.value) || 0);
        
        // 累加總數
        vDay += vDayChecked;
        vHour += vHourVal;
        pDay += pDayChecked;
        pHour += pHourVal;
        sDay += sDayChecked;
        sHour += sHourVal;
        lateMin += lateMinVal;
        lateNoDeductMin += lateNoDeductMinVal;
        fDay += fDayChecked;
        fHour += fHourVal;
        otHour += otHourVal;
        
        // 記錄詳細假別
        if (vDayChecked) vacationRecords.push({ days: 1, date: date, type: '天' });
        if (vHourVal > 0) vacationRecords.push({ hours: vHourVal, date: date, type: '小時' });
        if (pDayChecked) leaveRecords.push({ days: 1, date: date });
        if (pHourVal > 0) leaveRecords.push({ hours: pHourVal, date: date });
        if (sDayChecked) sickRecords.push({ days: 1, date: date });
        if (sHourVal > 0) sickRecords.push({ hours: sHourVal, date: date });
        if (lateMinVal > 0) lateRecords.push({ minutes: lateMinVal, date: date });
        if (lateNoDeductMinVal > 0) lateNoDeductRecords.push({ minutes: lateNoDeductMinVal, date: date });
        if (punchInVal) {
            punchInCount++;
            punchCardMissRecords.push({ type: '上班', date: date });
        }
        if (punchOutVal) {
            punchOutCount++;
            punchCardMissRecords.push({ type: '下班', date: date });
        }
        if (mHourVal > 0) {
            menstrualRecords.push({ hours: mHourVal, date: date });
            mHour += mHourVal;
        }
        if (fDayChecked) funeralRecords.push({ days: 1, date: date });
        if (fHourVal > 0) funeralRecords.push({ hours: fHourVal, date: date });
        if (otHourVal > 0) overtimeRecords.push({ hours: otHourVal, date: date });
    });

    const name = document.getElementById("teacherNameLeave").value.trim();
    const head = name ? `${name}\n` : '';

    let result = '';
    if (vDay > 0 || vHour > 0) {
        result += `✅ 特休/補休：${vDay} 天 ${vHour} 小時`;
        const vacationDetails = vacationRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours || record.days}${record.hours ? '小時' : '天'})`;
        }).join('、');
        if (vacationDetails) result += `      ${vacationDetails}\n`;
        else result += '\n';
    }

    const totalBufferCount = lateNoDeductRecords.length + punchInCount + punchOutCount;
    if (lateNoDeductMin > 0 || punchInCount > 0 || punchOutCount > 0) {
        let bufferString = `✅ 全勤緩衝：`;
        const lateDetails = lateNoDeductRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.minutes}分鐘)`;
        }).join('、');

        const punchCardDetails = punchCardMissRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.type})`;
        }).join('、');

        if (lateNoDeductMin > 0) bufferString += `遲到不扣 ${lateDetails}`;
        if (punchInCount > 0 || punchOutCount > 0) {
            if (lateNoDeductMin > 0) bufferString += "，";
            bufferString += `漏打卡 ${punchCardDetails}`;
        }
        if (totalBufferCount > 3) bufferString += MESSAGES.FULL_ATTENDANCE_LOST;
        result += bufferString + "\n";
    }

    if (fDay > 0 || fHour > 0) {
        result += `✅ 喪假：${fDay} 天 ${fHour} 小時`;
        const funeralDetails = funeralRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours || record.days}${record.hours ? '小時' : '天'})`;
        }).join('、');
        if (funeralDetails) result += `      ${funeralDetails}\n`;
        else result += '\n';
    }

    if (otHour > 0) {
        result += `✅ 超時：${otHour} 小時`;
        const overtimeDetails = overtimeRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours}小時)`;
        }).join('、');
        if (overtimeDetails) result += `      ${overtimeDetails}\n`;
        else result += '\n';
    }

    if (pDay > 0 || pHour > 0) {
        result += `✅ 事假：${pDay} 天 ${pHour} 小時`;
        const leaveDetails = leaveRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours || record.days}${record.hours ? '小時' : '天'})`;
        }).join('、');
        if (leaveDetails) result += `      ${leaveDetails}\n`;
        else result += '\n';
    }

    if (sDay > 0 || sHour > 0) {
        result += `✅ 病假：${sDay} 天 ${sHour} 小時`;
        const sickDetails = sickRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours || record.days}${record.hours ? '小時' : '天'})`;
        }).join('、');
        if (sickDetails) result += `      ${sickDetails}\n`;
        else result += '\n';
    }

    if (mHour > 0) {
        result += `✅ 生理假：${mHour} 小時 ${mHour > 8 ? MESSAGES.MENSTRUAL_OVER_LIMIT : ""}`;
        const mDetails = menstrualRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.hours}小時)`;
        }).join('、');
        if (mDetails) result += `　　${mDetails}\n`;
        else result += '\n';
    }

    if (lateMin > 0) {
        result += `✅ 遲到：${lateMin} 分鐘`;
        const lateDetails = lateRecords.map(record => {
            const weekday = getChineseWeekday(record.date).replace(/[()]/g, '');
            return `(${record.date} ${weekday} ${record.minutes}分鐘)`;
        }).join('、');
        if (lateDetails) result += `　　${lateDetails}\n`;
        else result += '\n';
    }

    const inputCashOutDays = parseFloat(document.getElementById("inputCashOutDays").value) || 0;
    const inputCashOutHours = parseFloat(document.getElementById("inputCashOutHours").value) || 0;
    if (inputCashOutDays > 0 || inputCashOutHours > 0) {
        result += `💰 預計折現：${inputCashOutDays} 天 ${inputCashOutHours} 小時\n`;
    }

    document.getElementById("resultsLeave").innerText = head + result;
}

function copyResultsLeave() {
    const resultText = document.getElementById("resultsLeave").innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        showToast(MESSAGES.COPY_SUCCESS);
    }, () => {
        showToast(MESSAGES.COPY_FAIL);
    });
}

function importToAll() {
    importLeaveResults();
    // 匯入表格的功能如果還沒實現，可以考慮在這裡呼叫相關函數
}

function importLeaveResults() {
    let totalLeaveDays = 0;
    let totalLeaveHours = 0;
    leaveRecords.forEach(record => {
        if (record.days) totalLeaveDays += record.days;
        if (record.hours) totalLeaveHours += record.hours;
    });

    let totalSickDays = 0;
    let totalSickHours = 0;
    sickRecords.forEach(record => {
        if (record.days) totalSickDays += record.days;
        if (record.hours) totalSickHours += record.hours;
    });

    let totalLateMinutes = 0;
    lateRecords.forEach(record => {
        if (record.minutes) totalLateMinutes += record.minutes;
    });

    let totalMenstrualHours = 0;
    menstrualRecords.forEach(record => {
        if (record.hours) totalMenstrualHours += record.hours;
    });

    document.getElementById("leaveDaysSalary").value = totalLeaveDays;
    document.getElementById("leaveHoursSalary").value = totalLeaveHours;
    document.getElementById("sickDaysSalary").value = totalSickDays;
    document.getElementById("sickHoursSalary").value = totalSickHours;
    document.getElementById("lateMinutesSalary").value = totalLateMinutes;
    document.getElementById("menstrualHoursSalary").value = totalMenstrualHours;

    const teacherNameLeave = document.getElementById("teacherNameLeave").value.trim();
    if (teacherNameLeave) {
        document.getElementById("nameSalary").value = teacherNameLeave;
    }

    const inputCashOutDays = parseFloat(document.getElementById("inputCashOutDays").value) || 0;
    const inputCashOutHours = parseFloat(document.getElementById("inputCashOutHours").value) || 0;
    document.getElementById("cashOutDaysSalary").value = inputCashOutDays;
    document.getElementById("cashOutHoursSalary").value = inputCashOutHours;

    showToast(MESSAGES.IMPORT_SUCCESS);
}

function calculateSalaryDeduction() {
    // 獲取所有輸入值
    const name = document.getElementById("nameSalary").value.trim();
    const salary = getValue("salary");
    const leaveDays = getValue("leaveDaysSalary");
    const leaveHours = getValue("leaveHoursSalary");
    const sickDays = getValue("sickDaysSalary");
    const sickHours = getValue("sickHoursSalary");
    const menstrualHours = getValue("menstrualHoursSalary");
    const lateMinutes = getValue("lateMinutesSalary");
    const cashOutDays = getValue("cashOutDaysSalary");
    const cashOutHours = getValue("cashOutHoursSalary");

    // 計算不支薪金額（這些是原始、未四捨五入的精確值）
    const rawLeaveDayDeduct = leaveDays * (salary / 30);
    const rawLeaveHourDeduct = leaveHours * (salary / 30 / 8);
    const rawSickDayDeduct = sickDays * (salary / 30 / 2); // 病假半薪
    const rawSickHourDeduct = sickHours * (salary / 30 / 8 / 2); // 病假半薪
    const rawLateDeduct = lateMinutes * (salary / 30 / 8 / 60);
    const rawMenstrualDeduct = menstrualHours * (salary / 30 / 8 / 2); // 生理假半薪 (通常)

    // 計算折現金額（這些是原始、未四捨五入的精確值）
    const rawCashOutDayBonus = cashOutDays * (salary / 30);
    const rawCashOutHourBonus = cashOutHours * (salary / 30 / 8);

    // 計算「不支薪總共幾元」，最終數字要無條件捨去 (Math.floor)
    // 這裡的加總使用原始精確值，然後才進行 Math.floor
    const totalDeduct = Math.floor(rawLeaveDayDeduct + rawLeaveHourDeduct + rawSickDayDeduct + rawSickHourDeduct + rawLateDeduct + rawMenstrualDeduct);
    
    // 計算「折現總共幾元」，最終數字要無條件進位 (Math.ceil)
    // 這裡的加總使用原始精確值，然後才進行 Math.ceil
    const totalCashOutBonus = Math.ceil(rawCashOutDayBonus + rawCashOutHourBonus);

    let resultText = `${name ? name + "：" : ""}明細如下：\n`;

    // 顯示個別扣薪明細時，仍使用四捨五入 (Math.round())
    if (leaveDays > 0) resultText += `➖事假 ${leaveDays}天 × ${salary}/30 = ${Math.round(rawLeaveDayDeduct)}元\n`;
    if (leaveHours > 0) resultText += `➖事假 ${leaveHours}小時 × ${salary}/30/8 = ${Math.round(rawLeaveHourDeduct)}元\n`;
    if (sickDays > 0) resultText += `➖病假 ${sickDays}天 × ${salary}/30/2 = ${Math.round(rawSickDayDeduct)}元\n`;
    if (sickHours > 0) resultText += `➖病假 ${sickHours}小時 × ${salary}/30/8/2 = ${Math.round(rawSickHourDeduct)}元\n`;
    if (lateMinutes > 0) resultText += `➖遲到 ${lateMinutes}分鐘 × ${salary}/30/8/60 = ${Math.round(rawLateDeduct)}元\n`;
    if (menstrualHours > 0) resultText += `➖生理假 ${menstrualHours}小時 × ${salary}/30/8/2 = ${Math.round(rawMenstrualDeduct)}元\n`;

    resultText += `不支薪總共：${totalDeduct.toLocaleString('zh-TW')} 元\n`; // 顯示無條件捨去後的總額

    // 💰 顯示折現算式
    if (cashOutDays > 0) resultText += `➕折現 ${cashOutDays}天 × ${salary}/30 = ${Math.round(rawCashOutDayBonus)}元\n`;
    if (cashOutHours > 0) resultText += `➕折現 ${cashOutHours}小時 × ${salary}/30/8 = ${Math.round(rawCashOutHourBonus)}元\n`;
    if (cashOutDays > 0 || cashOutHours > 0) resultText += `折現總共：${totalCashOutBonus.toLocaleString('zh-TW')} 元\n`; // 顯示無條件進位後的總額

    // 移除實領薪資的計算和顯示

    // 將結果顯示在頁面上
    document.getElementById("salaryResult").innerText = resultText;
}

function copyResultsSalary() {
    const resultText = document.getElementById("salaryResult").innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        showToast(MESSAGES.COPY_SUCCESS);
    }, () => {
        showToast(MESSAGES.COPY_FAIL);
    });
}


// ====== 初始化設定和事件監聽 ======
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    document.getElementById("yearInput").value = today.getFullYear();
    document.getElementById("monthInput").value = today.getMonth() + 1; // getMonth() 回傳 0-11

    // 綁定所有主要按鈕和輸入框的事件
    document.getElementById('generateTableBtn').addEventListener('click', generateTable);
    document.getElementById('copyResultsLeaveBtn').addEventListener('click', copyResultsLeave);
    document.getElementById('importToAllBtn').addEventListener('click', importToAll);
    document.getElementById('calculateSalaryDeductionBtn').addEventListener('click', calculateSalaryDeduction);
    document.getElementById('copyResultsSalaryBtn').addEventListener('click', copyResultsSalary);

    // 假別統計區塊的輸入框
    document.getElementById('teacherNameLeave').addEventListener('input', calculateLeave);
    document.getElementById('inputCashOutDays').addEventListener('input', calculateLeave);
    document.getElementById('inputCashOutHours').addEventListener('input', calculateLeave);
    document.getElementById('yearInput').addEventListener('input', generateTable);
    document.getElementById('monthInput').addEventListener('input', generateTable);

    // 薪資計算區塊的輸入框（這些不會觸發 calculateLeave，而是 calculateSalaryDeduction）
    document.getElementById('nameSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('salary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('leaveDaysSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('leaveHoursSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('sickDaysSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('sickHoursSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('menstrualHoursSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('lateMinutesSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('cashOutDaysSalary').addEventListener('input', calculateSalaryDeduction);
    document.getElementById('cashOutHoursSalary').addEventListener('input', calculateSalaryDeduction);

    // 頁面載入時先生成一次表格
    generateTable();
});

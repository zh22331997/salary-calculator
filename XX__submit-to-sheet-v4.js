// 🔗 對應各分校的 Google 表單資訊
const FORM_MAP = {
  '永和校': {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfYY01DLsBiAvEFMnevrIGKYUQ7TaTe899nZ3_rYymCCuApNg/formResponse',
    fields: {
      ym: 'entry.1555802912',
      branch: 'entry.1959195059',
      name: 'entry.997552322',
      type: 'entry.419119839',
      total: 'entry.1013319206',
      notes: 'entry.2015698377'
    }
  },
  '永平校': {
    url: 'https://docs.google.com/forms/d/e/永平校_FORM_ID/formResponse',
    fields: {
      ym: 'entry.XXXX',
      branch: 'entry.XXXX',
      name: 'entry.XXXX',
      type: 'entry.XXXX',
      total: 'entry.XXXX',
      notes: 'entry.XXXX'
    }
  },
  '江翠校': {
    url: 'https://docs.google.com/forms/d/e/江翠校_FORM_ID/formResponse',
    fields: {
      ym: 'entry.XXXX',
      branch: 'entry.XXXX',
      name: 'entry.XXXX',
      type: 'entry.XXXX',
      total: 'entry.XXXX',
      notes: 'entry.XXXX'
    }
  },
  '秀朗校': {
    url: 'https://docs.google.com/forms/d/e/秀朗校_FORM_ID/formResponse',
    fields: {
      ym: 'entry.XXXX',
      branch: 'entry.XXXX',
      name: 'entry.XXXX',
      type: 'entry.XXXX',
      total: 'entry.XXXX',
      notes: 'entry.XXXX'
    }
  },
  '清水校': {
    url: 'https://docs.google.com/forms/d/e/清水校_FORM_ID/formResponse',
    fields: {
      ym: 'entry.XXXX',
      branch: 'entry.XXXX',
      name: 'entry.XXXX',
      type: 'entry.XXXX',
      total: 'entry.XXXX',
      notes: 'entry.XXXX'
    }
  }
};

// 📤 送出資料到對應分校的 Google 表單
function submitToGoogleForm(rows, branch) {
  const config = FORM_MAP[branch];
  if (!config) {
    showToast(`❌ 找不到 ${branch} 的表單設定`, 'error');
    return;
  }

  console.log(`▶️ 正在上傳到 ${branch}，表單網址：${config.url}`);

  if (rows.length === 0) {
    showToast('⚠️ 表格沒有資料，請先分析資料！', 'error');
    console.warn('❌ 尚未分析資料，無法上傳！');
    return;
  }

  const submitButton = document.querySelector('button[onclick="submitToGoogle()"]');
  if (submitButton) submitButton.disabled = true;

  let successCount = 0;

  rows.forEach((row, index) => {
    const formData = new FormData();
    formData.append(config.fields.ym, row[0]);
    formData.append(config.fields.branch, row[1]);
    formData.append(config.fields.name, row[2]);
    formData.append(config.fields.type, row[3]);
    formData.append(config.fields.total, row[4]);
    formData.append(config.fields.notes, row[5]);

    fetch(config.url, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    }).then(() => {
      successCount++;
      if (successCount === rows.length) {
        showToast(`✅ 成功送出 ${rows.length} 筆到 ${branch}`, 'success');

        // ✅ 清空輸入欄位
        const inputField = document.getElementById('input');
        if (inputField) inputField.value = '';

        // ✅ 重新啟用按鈕
        if (submitButton) submitButton.disabled = false;
      }
    }).catch((err) => {
      console.error('❌ 發送錯誤：', err);
      showToast(`❌ 上傳失敗，第 ${index + 1} 筆`, 'error');

      // 啟用按鈕即使出錯
      if (submitButton) submitButton.disabled = false;
    });
  });

  console.log(`📤 已啟動送出 ${rows.length} 筆資料至 ${branch}`);
}



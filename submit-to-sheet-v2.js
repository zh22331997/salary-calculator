// submit-to-sheet-v2.js

// 🗺️ 對應各分校的 Google 表單 ID（來源是你提供的）
const SHEET_MAP = {
  '永平校': '1W8ovJuj9UNuxsjXemiLA9-fgMLK3Q_ownDLeKBxmOSM',
  '永和校': '1IA0lO9_hloq2ctFHTQBMsx5qHzI8AjyqbG-RmHBTvjk',
  '江翠校': '1O_wfYq1GdZhTa6kM853KIWzupBAvvRhqi8n8-K8H3zI',
  '秀朗校': '1gzRy8Um9FFC4tr2MTO7s8nZGfu7VGQH_13usIIJkveM',
  '清水校': '16HEt6ygPC_ObtWNAJQbGuJaRjJClTAPiwL1rdx8d0us'
};

// 📤 將多筆資料送出到 Google Sheet 對應表單
function submitToGoogleSheetForm(rows, branch) {
  const sheetId = SHEET_MAP[branch];
  if (!sheetId) {
    showToast(`❌ 找不到「${branch}」的表單 ID！`, 'error');
    return;
  }

  let submittedCount = 0;

  rows.forEach((row, index) => {
    const form = document.createElement('form');
    form.action = `https://docs.google.com/forms/d/e/${sheetId}/formResponse`;
    form.method = 'POST';
    form.target = 'invisible_iframe_' + index;

    row.forEach((cell, i) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = `entry.${1000 + i}`;
      input.value = cell;
      form.appendChild(input);
    });

    // 建立一個隱藏 iframe 承接回傳（避免閃動）
    const iframe = document.createElement('iframe');
    iframe.name = 'invisible_iframe_' + index;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    document.body.appendChild(form);

    // 延遲送出，避免太快被視為機器行為（非必要但穩健）
    setTimeout(() => {
      form.submit();

      // 顯示上傳進度
      showToast(`📤 正在上傳第 ${index + 1} / ${rows.length} 筆`, 'info');

      submittedCount++;
      if (submittedCount === rows.length) {
        // 全部完成後再顯示成功提示
        setTimeout(() => {
          showToast(`✅ 已成功送出 ${rows.length} 筆資料到 ${branch}`, 'success');
        }, 500);
      }

      // 清除表單與 iframe
      setTimeout(() => {
        form.remove();
        iframe.remove();
      }, 3000);

    }, index * 300); // 每筆間隔 300ms，避免過快被 Google 封鎖
  });
}

// 🔔 toast 提示
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '30px';
  toast.style.backgroundColor = type === 'error' ? '#d9534f' : '#6b6d76';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  toast.style.zIndex = '9999';
  toast.style.fontSize = '16px';

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

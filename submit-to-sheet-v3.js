// submit-to-sheet-v3.js

// 🔗 對應各分校的 Google Apps Script Web App URL
const ENDPOINT_MAP = {
  '永平校': 'https://script.google.com/macros/s/XXXXXXXX永平XXXXXXXX/exec',
  '永和校': 'https://script.google.com/macros/s/AKfycbwPqiPVD8uk3iHkhWFbkSyVP1hgr2MgpFpeLp0rFV0iNq_tr0iSJdji7T9VB_xLXk-x2A/exec',
  '江翠校': 'https://script.google.com/macros/s/XXXXXXXX江翠XXXXXXXX/exec',
  '秀朗校': 'https://script.google.com/macros/s/XXXXXXXX秀朗XXXXXXXX/exec',
  '清水校': 'https://script.google.com/macros/s/XXXXXXXX清水XXXXXXXX/exec'
};

// 📤 將多筆資料透過 <form> POST 傳送到 Apps Script Web App
function submitToGoogleSheetForm(rows, branch) {
  const endpoint = ENDPOINT_MAP[branch];
  if (!endpoint) {
    showToast(`❌ 找不到「${branch}」的上傳網址`, 'error');
    return;
  }

  let submittedCount = 0;

  rows.forEach((row, index) => {
    const form = document.createElement('form');
    form.action = endpoint;
    form.method = 'POST';
    form.target = 'hidden_iframe_' + index;

    // 對應六欄欄位名稱
    const fieldNames = ['ym', 'branch', 'name', 'type', 'subtotal', 'note'];
    fieldNames.forEach((key, i) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = row[i] || '';
      form.appendChild(input);
    });

    const iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe_' + index;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    document.body.appendChild(form);

    setTimeout(() => {
      form.submit();
      showToast(`📤 上傳第 ${index + 1} / ${rows.length} 筆...`, 'info');

      submittedCount++;
      if (submittedCount === rows.length) {
        setTimeout(() => {
          showToast(`✅ 已成功上傳 ${rows.length} 筆到 ${branch}`, 'success');
        }, 500);
      }

      setTimeout(() => {
        form.remove();
        iframe.remove();
      }, 3000);

    }, index * 300);
  });
}

// 🔔 toast 提示
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '30px';
  toast.style.backgroundColor = type === 'error' ? '#d9534f' : (type === 'info' ? '#5bc0de' : '#6b6d76');
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  toast.style.zIndex = '9999';
  toast.style.fontSize = '16px';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

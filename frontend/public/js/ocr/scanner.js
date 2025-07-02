document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = getApiBaseUrl();
  
  document.getElementById('extractBtn').addEventListener('click', () => {
    const input = document.getElementById('imageInput');
    const loadingStatus = document.getElementById('loadingStatus');
    
    if (input.files.length === 0) {
      alert('Please select an image file');
      return;
    }

    // Show loading status
    loadingStatus.textContent = 'Processing image, please wait...';
    loadingStatus.className = '';

    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    fetch(`${API_BASE_URL}/extract-text`, {
      method: 'POST',
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      // Clear loading status
      loadingStatus.textContent = '';
      
      // Show demo mode warning if applicable
      if (data.ocr_status === 'demo_mode') {
        loadingStatus.textContent = '⚠️ Running in demo mode: Tesseract OCR is not installed. Sample data is being shown.';
        loadingStatus.className = 'warning-status';
      }
      
      document.getElementById('extractedText').textContent = data.extracted_text || 'No text found.';
      document.getElementById('savedFile').textContent = 'Not saved yet.';

      const tableBody = document.querySelector('#itemsTable tbody');
      tableBody.innerHTML = '';
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          const row = document.createElement('tr');
          ['name', 'quantity', 'barcode', 'cost_price', 'selling_price'].forEach(field => {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = field === 'quantity' || field.includes('price') ? 'number' : 'text';
            input.value = item[field];
            input.setAttribute('data-field', field);
            input.setAttribute('data-index', index);
            input.step = field.includes('price') ? '0.01' : '1';
            cell.appendChild(input);
            row.appendChild(cell);
          });
          tableBody.appendChild(row);
        });
      } else {
        // If no items were found, show a message
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'No items detected. Check the image and try again, or add items manually.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
      }
    })
    .catch(err => {
      loadingStatus.textContent = `Error: ${err.message}`;
      loadingStatus.className = 'error-status';
      console.error(err);
    });
  });

  document.getElementById('confirmBtn').addEventListener('click', () => {
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    const updatedItems = [];
    
    // If there's a message row (no items found), don't try to save
    if (rows.length === 1 && rows[0].querySelector('td[colspan="5"]')) {
      alert('No items to save!');
      return;
    }

    rows.forEach((row) => {
      const inputs = row.querySelectorAll('input');
      if (inputs.length === 0) return; // Skip message rows
      
      const item = {};
      inputs.forEach(input => {
        const field = input.getAttribute('data-field');
        let value = input.value;
        if (field === 'quantity') value = parseInt(value) || 0;
        else if (field === 'cost_price' || field === 'selling_price') value = parseFloat(value) || 0;
        item[field] = value;
      });
      updatedItems.push(item);
    });

    if (updatedItems.length === 0) {
      alert('No valid items to save!');
      return;
    }

    fetch(`${API_BASE_URL}/save-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: updatedItems })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      document.getElementById('savedFile').textContent = data.saved_file
        ? `✅ Saved as: ${data.saved_file}`
        : 'Failed to save.';
      
      // You could add functionality here to add these products to your inventory
      // by connecting to your product API endpoints
    })
    .catch(err => {
      document.getElementById('savedFile').textContent = `❌ Error: ${err.message}`;
      document.getElementById('savedFile').className = 'error-status';
      console.error(err);
    });
  });

  // Helper function to determine the API base URL
  function getApiBaseUrl() {
    // Detect if we're in development or production
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000'; // Local Flask server
    } else if (hostname.includes('vercel.app')) {
      // If deployed on Vercel, use the Render backend
      return 'https://smart-pos-ocr-api.onrender.com';
    } else if (hostname.includes('render.com')) {
      // If frontend is on Render too
      return 'https://smart-pos-ocr-api.onrender.com';
    }
    // Fallback URL - update this with your actual production API URL
    return 'https://smart-pos-ocr-api.onrender.com';
  }
});

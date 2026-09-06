// Rich Interactivity Engine for Nilotic Frost Prototype
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Toast Notification Engine ---
  const toastContainer = document.createElement('div');
  toastContainer.id = 'prototype-toast-container';
  toastContainer.className = 'fixed bottom-5 left-5 z-[9999] flex flex-col gap-2 pointer-events-none';
  document.body.appendChild(toastContainer);

  window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-[#012d1d] text-white border border-[#1b4332]' : 'bg-[#0054cd] text-white';
    toast.className = `toast-notification flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl ${bgClass} text-sm font-medium pointer-events-auto min-w-[280px]`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px]">${type === 'success' ? 'check_circle' : 'info'}</span>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="hover:opacity-80"><span class="material-symbols-outlined text-[16px]">close</span></button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // --- 2. Interactive Tab Switching ---
  const allTabs = document.querySelectorAll('button, a[href="#"]');
  allTabs.forEach(tab => {
    const parentContainer = tab.closest('.border-b, [role="tablist"]');
    if (parentContainer) {
      tab.addEventListener('click', (e) => {
        const text = tab.innerText.trim();
        if (text && !tab.closest('nav') && !tab.closest('aside') && !tab.closest('form') && !tab.closest('.step-wizard-container') && !tab.closest('#shipment-wizard-container') && !window.location.pathname.toLowerCase().includes('shipment-wizard.html') && !window.location.href.toLowerCase().includes('shipment-wizard.html')) {
          e.preventDefault();
          const siblingTabs = parentContainer.querySelectorAll('button, a');
          siblingTabs.forEach(t => {
            t.classList.remove('border-primary', 'text-primary', 'border-b-2', 'font-bold', 'bg-primary', 'text-on-primary');
            t.classList.add('text-on-surface-variant');
          });
          tab.classList.add('border-primary', 'text-primary', 'border-b-2', 'font-bold');
          tab.classList.remove('text-on-surface-variant');

          // Optional toast feedback
          window.showToast(`عرض قسم: ${text}`, 'info');
        }
      });
    }
  });

  // --- 3. Multi-Step Wizard Engine ---
  const isCustomWizardPage = window.location.pathname.toLowerCase().includes('shipment-wizard.html') || window.location.href.toLowerCase().includes('shipment-wizard.html') || document.querySelector('[data-custom-wizard="true"], .custom-wizard-container, #shipment-wizard-container');
  if (!isCustomWizardPage) {
    const stepContainers = document.querySelectorAll('form:not([data-custom-wizard]), .step-wizard-container:not(.custom-wizard)');
    stepContainers.forEach(container => {
      if (container.closest('[data-custom-wizard]') || container.classList.contains('custom-wizard') || container.closest('#shipment-wizard-container')) {
        return;
      }
      
      let currentStep = 1;
      const totalSteps = 4;

      const updateWizardVisuals = (step) => {
        window.showToast(`الانتقال إلى الخطوة ${step} من ${totalSteps}`, 'info');
      };

      container.querySelectorAll('button').forEach(btn => {
        if (btn.closest('[data-custom-wizard]') || btn.closest('.custom-wizard') || btn.closest('#shipment-wizard-container')) {
          return;
        }
        const btnText = btn.innerText.trim();
        if (btnText.includes('التالي') || btnText.includes('الخطوة التالية')) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStep < totalSteps) {
              currentStep++;
              updateWizardVisuals(currentStep);
            }
          });
        } else if (btnText.includes('السابق') || btnText.includes('الخطوة السابقة')) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStep > 1) {
              currentStep--;
              updateWizardVisuals(currentStep);
            }
          });
        }
      });
    });
  }

  // --- 4. Live Table Search & Filtering ---
  const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
  searchInputs.forEach(input => {
    const placeholder = (input.placeholder || '').toLowerCase();
    if (placeholder.includes('بحث') || placeholder.includes('search')) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const table = document.querySelector('table');
        if (table) {
          const rows = table.querySelectorAll('tbody tr');
          let visibleCount = 0;
          rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            if (!query || text.includes(query)) {
              row.style.display = '';
              visibleCount++;
            } else {
              row.style.display = 'none';
            }
          });
        }
      });
    }
  });

  // --- 5. Form Submissions Simulation ---
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.showToast('تم حفظ البيانات والنموذج بنجاح!', 'success');
    });
  });

  // --- 6. Quick Action Buttons ---
  document.querySelectorAll('button').forEach(btn => {
    const text = btn.innerText.trim();
    if ((text.includes('حفظ') || text.includes('تأكيد') || text.includes('طباعة') || text.includes('تصدير')) && !btn.closest('form')) {
      btn.addEventListener('click', () => {
        window.showToast(`تم تنفيذ إجراء: ${text}`, 'success');
      });
    }
  });
});

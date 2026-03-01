document.addEventListener('DOMContentLoaded', () => {
    // Select all input fields that affect calculations
    const unitPriceInputs = document.querySelectorAll('.unit-price');
    const durationInputs = document.querySelectorAll('.duration');
    const overheadRateInput = document.getElementById('overhead-rate');
    const profitRateInput = document.getElementById('profit-rate');

    // Select display fields
    const directLaborTotalEl = document.getElementById('direct-labor-total');

    // Sub-calculation fields
    const subDirectLaborEl = document.getElementById('sub-direct-labor');
    const subOverheadEl = document.getElementById('sub-overhead');

    const subLaborOverheadEl = document.getElementById('sub-labor-overhead');
    const subProfitEl = document.getElementById('sub-profit');

    // Final summary fields
    const finalDirectLaborEl = document.getElementById('final-direct-labor');
    const finalOverheadEl = document.getElementById('final-overhead');
    const finalProfitEl = document.getElementById('final-profit');
    const finalGrandTotalEl = document.getElementById('final-grand-total');
    const grandTotalTopEl = document.getElementById('grand-total-top');

    // PDF Button
    const pdfBtn = document.getElementById('pdf-download-btn');

    // Format number with commas
    const formatNumber = (num) => {
        return Math.round(num).toLocaleString('ko-KR');
    };

    const calculateRow = (row) => {
        const priceInput = row.querySelector('.unit-price');
        const durationInput = row.querySelector('.duration');
        const totalCell = row.querySelector('.row-total');

        const price = parseFloat(priceInput.value) || 0;
        const duration = parseFloat(durationInput.value) || 0;
        const total = price * duration;

        totalCell.textContent = formatNumber(total);
        return total;
    };

    const calculateAll = () => {
        let totalDirectLabor = 0;

        // Iterate through all role rows
        const rows = document.querySelectorAll('.role-row');
        rows.forEach(row => {
            // Some rows might be just description extensions (merged cells), 
            // check if they have inputs
            if (row.querySelector('.unit-price')) {
                totalDirectLabor += calculateRow(row);
            }
        });

        // Get dynamic rates
        const overheadRatePercent = parseFloat(overheadRateInput.value) || 0;
        const profitRatePercent = parseFloat(profitRateInput.value) || 0;

        // 1. Direct Labor
        directLaborTotalEl.textContent = formatNumber(totalDirectLabor);

        // 2. Overhead (Direct Labor * Rate%)
        const overhead = totalDirectLabor * (overheadRatePercent / 100);

        // Update Section 1
        subDirectLaborEl.textContent = formatNumber(totalDirectLabor);
        subOverheadEl.textContent = formatNumber(overhead);

        // 3. Technical Profit ((Direct Labor + Overhead) * Rate%)
        const laborPlusOverhead = totalDirectLabor + overhead;
        const profit = laborPlusOverhead * (profitRatePercent / 100);

        // Update Section 2
        subLaborOverheadEl.textContent = formatNumber(laborPlusOverhead);
        subProfitEl.textContent = formatNumber(profit);

        // 4. Grand Total
        const grandTotal = totalDirectLabor + overhead + profit;

        // Update Section 3 & Final
        finalDirectLaborEl.textContent = formatNumber(totalDirectLabor);
        finalOverheadEl.textContent = formatNumber(overhead);
        finalProfitEl.textContent = formatNumber(profit);

        finalGrandTotalEl.textContent = formatNumber(grandTotal);
        grandTotalTopEl.textContent = formatNumber(grandTotal);
    };

    // Attach event listeners
    unitPriceInputs.forEach(input => {
        input.addEventListener('input', calculateAll);
    });
    durationInputs.forEach(input => {
        input.addEventListener('input', calculateAll);
    });

    // Attach listeners to rate inputs
    if (overheadRateInput) overheadRateInput.addEventListener('input', calculateAll);
    if (profitRateInput) profitRateInput.addEventListener('input', calculateAll);

    // Row Management
    const addRowBtns = document.querySelectorAll('.add-row-btn');
    const removeRowBtns = document.querySelectorAll('.remove-row-btn');

    const addRow = (btn) => {
        const cell = btn.closest('td');
        const row = cell.closest('tr');
        const tbody = document.getElementById('quotation-body');

        let rowspan = parseInt(cell.getAttribute('rowspan') || 1);
        const descCell = row.querySelector('td:last-child');
        let descRowspan = parseInt(descCell.getAttribute('rowspan') || 1);

        // Update rowspans
        cell.setAttribute('rowspan', rowspan + 1);
        descCell.setAttribute('rowspan', descRowspan + 1);

        // Create new row
        const newRow = document.createElement('tr');
        newRow.className = 'role-row';
        newRow.innerHTML = `
            <td><input type="text" class="text-input" value="New Role"></td>
            <td>
                <select class="grade-select">
                    <option value="특급기술자">특급 기술자</option>
                    <option value="고급기술자">고급 기술자</option>
                    <option value="중급기술자" selected>중급 기술자</option>
                    <option value="초급기술자">초급 기술자</option>
                </select>
            </td>
            <td><input type="number" class="num-input unit-price" value="0"></td>
            <td><input type="number" class="num-input duration" value="1.0" step="0.1"></td>
            <td class="row-total">0</td>
        `;

        // Find insertion point (skip rowspan-1 rows)
        let lastRow = row;
        for (let i = 0; i < rowspan - 1; i++) {
            if (lastRow.nextElementSibling) {
                lastRow = lastRow.nextElementSibling;
            }
        }

        if (lastRow.nextElementSibling) {
            tbody.insertBefore(newRow, lastRow.nextElementSibling);
        } else {
            tbody.appendChild(newRow);
        }

        // Re-attach event listeners
        const newInputs = newRow.querySelectorAll('input, select');
        newInputs.forEach(input => {
            input.addEventListener('input', calculateAll);
        });
    };

    const removeRow = (btn) => {
        const cell = btn.closest('td');
        const row = cell.closest('tr');
        const tbody = document.getElementById('quotation-body');

        let rowspan = parseInt(cell.getAttribute('rowspan') || 1);

        // Only allow deletion if there's more than 1 row
        if (rowspan <= 1) return;

        const descCell = row.querySelector('td:last-child');
        let descRowspan = parseInt(descCell.getAttribute('rowspan') || 1);

        // Find the last row of the group to remove
        let lastRow = row;
        for (let i = 0; i < rowspan - 1; i++) {
            if (lastRow.nextElementSibling) {
                lastRow = lastRow.nextElementSibling;
            }
        }

        // Remove the last row
        if (lastRow && lastRow !== row) {
            lastRow.remove();

            // Update rowspans
            cell.setAttribute('rowspan', rowspan - 1);
            descCell.setAttribute('rowspan', descRowspan - 1);

            // Recalculate
            calculateAll();
        }
    };

    addRowBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            addRow(e.target);
        });
    });

    removeRowBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            removeRow(e.target);
        });
    });

    // Initial calculation
    calculateAll();
});

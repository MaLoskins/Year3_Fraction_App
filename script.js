document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const mainGrid = document.getElementById('mainGrid');
    const fractionCategories = document.querySelectorAll('.fraction-category');
    const eraseButton = document.getElementById('eraseButton');
    const resetButton = document.getElementById('resetButton');
    const infoButton = document.getElementById('infoButton');
    const fractionSumDisplay = document.getElementById('fractionSum'); // Optional
    const infoModal = document.getElementById('infoModal');
    const closeButton = document.querySelector('.close-button');

    // Fraction Data
    const fractions = [
        { numerator: 1, denominator: 1, class: 'fraction-1' },     // 1 (Whole)
        { numerator: 1, denominator: 2, class: 'fraction-1-2' },   // 1/2
        { numerator: 1, denominator: 3, class: 'fraction-1-3' },   // 1/3
        { numerator: 1, denominator: 4, class: 'fraction-1-4' },   // 1/4
        { numerator: 1, denominator: 5, class: 'fraction-1-5' },   // 1/5
        { numerator: 1, denominator: 6, class: 'fraction-1-6' },   // 1/6
        { numerator: 1, denominator: 8, class: 'fraction-1-8' },   // 1/8
        { numerator: 1, denominator: 10, class: 'fraction-1-10' }, // 1/10
        { numerator: 1, denominator: 12, class: 'fraction-1-12' }  // 1/12
    ];

    // Control States
    let isErasing = false;
    let draggedElement = null;
    let currentPointerId = null;
    let offsetX = 0;
    let offsetY = 0;

    // Initialize Fraction Bars
    function initFractionBars() {
        fractions.forEach(frac => {
            const bar = document.createElement('div');
            bar.classList.add('fraction-bar', frac.class);
            bar.setAttribute('draggable', false); // Disable native dragging
            bar.dataset.numerator = frac.numerator;
            bar.dataset.denominator = frac.denominator;
            bar.textContent = frac.denominator === 1 ? `${frac.numerator}` : `${frac.numerator}/${frac.denominator}`;
            bar.style.width = `${(frac.numerator / frac.denominator) * 100}%`; // Set width as percentage
            bar.title = `Fraction: ${bar.textContent}`; // Tooltip

            // Append to the appropriate category
            if (frac.denominator <= 4) {
                fractionCategories[0].appendChild(bar); // Basic Fractions
            } else {
                fractionCategories[1].appendChild(bar); // Advanced Fractions
            }

            // Add Pointer Event Listeners
            bar.addEventListener('pointerdown', handlePointerDown);
        });
    }

    // Handle Pointer Down
    function handlePointerDown(e) {
        // Only left mouse button or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault(); // Prevent default to avoid scrolling

        currentPointerId = e.pointerId;

        // Clone the fraction bar to create a draggable element
        draggedElement = e.target.cloneNode(true);
        draggedElement.classList.add('dragged-element');
        draggedElement.style.position = 'absolute';
        draggedElement.style.pointerEvents = 'none';
        draggedElement.style.zIndex = '1000';
        draggedElement.style.opacity = '0.8';

        // Get the original size
        const rect = e.target.getBoundingClientRect();
        draggedElement.style.width = `${rect.width}px`;
        draggedElement.style.height = `${rect.height}px`;
        draggedElement.style.left = `${e.clientX - rect.width / 2}px`;
        draggedElement.style.top = `${e.clientY - rect.height / 2}px`;

        document.body.appendChild(draggedElement);

        // Set capture to continue receiving pointer events even if the pointer moves outside the element
        e.target.setPointerCapture(e.pointerId);

        // Add event listeners for move and up
        e.target.addEventListener('pointermove', handlePointerMove);
        e.target.addEventListener('pointerup', handlePointerUp);
        e.target.addEventListener('pointercancel', handlePointerCancel);
    }

    // Handle Pointer Move
    function handlePointerMove(e) {
        if (e.pointerId !== currentPointerId) return;
        e.preventDefault();
        moveDraggedElement(e.clientX, e.clientY);
    }

    function moveDraggedElement(x, y) {
        if (draggedElement) {
            draggedElement.style.left = `${x - draggedElement.offsetWidth / 2}px`;
            draggedElement.style.top = `${y - draggedElement.offsetHeight / 2}px`;
        }
    }

    // Handle Pointer Up
    function handlePointerUp(e) {
        if (e.pointerId !== currentPointerId) return;
        e.preventDefault();

        // Determine drop target
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        const rowContent = dropTarget.closest('.row-content');

        if (rowContent) {
            // Get fraction data
            const numerator = e.target.dataset.numerator;
            const denominator = e.target.dataset.denominator;
            const fractionClass = getFractionClass(e.target);

            const fractionData = {
                numerator: parseInt(numerator, 10),
                denominator: parseInt(denominator, 10),
                class: fractionClass
            };

            const targetRow = rowContent.closest('.grid-row');
            const placed = placeFractionOnGrid(fractionData, targetRow);
            if (!placed) {
                alert('This row cannot accommodate the fraction. Please try a different row.');
            }
        }

        // Remove the dragged element
        if (draggedElement && draggedElement.parentElement) {
            draggedElement.parentElement.removeChild(draggedElement);
            draggedElement = null;
        }

        // Remove event listeners
        e.target.removeEventListener('pointermove', handlePointerMove);
        e.target.removeEventListener('pointerup', handlePointerUp);
        e.target.removeEventListener('pointercancel', handlePointerCancel);

        currentPointerId = null;
    }

    // Handle Pointer Cancel
    function handlePointerCancel(e) {
        if (e.pointerId !== currentPointerId) return;
        e.preventDefault();

        // Remove the dragged element
        if (draggedElement && draggedElement.parentElement) {
            draggedElement.parentElement.removeChild(draggedElement);
            draggedElement = null;
        }

        // Remove event listeners
        e.target.removeEventListener('pointermove', handlePointerMove);
        e.target.removeEventListener('pointerup', handlePointerUp);
        e.target.removeEventListener('pointercancel', handlePointerCancel);

        currentPointerId = null;
    }

    // Get Fraction Class
    function getFractionClass(element) {
        const classes = [
            'fraction-1',
            'fraction-1-2',
            'fraction-1-3',
            'fraction-1-4',
            'fraction-1-5',
            'fraction-1-6',
            'fraction-1-8',
            'fraction-1-10',
            'fraction-1-12'
        ];
        return classes.find(cls => element.classList.contains(cls)) || 'fraction-1-12';
    }

    // Function to Place Fraction with Snapping and Capacity Enforcement
    function placeFractionOnGrid(data, targetRow) {
        const rowContent = targetRow.querySelector('.row-content');
        const rowTotalDisplay = targetRow.querySelector('.row-total');
        const currentTotalFraction = parseFraction(rowTotalDisplay.textContent.replace('Total: ', ''));
        const fractionValue = { numerator: data.numerator, denominator: data.denominator };

        // Check if the fraction can fit in this row
        const newTotalFraction = addFractions(currentTotalFraction, fractionValue);
        if (newTotalFraction.numerator / newTotalFraction.denominator <= 1) {
            // Create Dropped Fraction Element
            const droppedFraction = document.createElement('div');
            droppedFraction.classList.add('dropped-fraction');
            droppedFraction.style.width = `${(fractionValue.numerator / fractionValue.denominator) * 100}%`; // Set width based on fraction

            // Create Fraction Bar inside Dropped Fraction
            const fractionBar = document.createElement('div');
            fractionBar.classList.add('fraction-bar', data.class);
            fractionBar.textContent = fractionValue.denominator === 1 ? `${fractionValue.numerator}` : `${fractionValue.numerator}/${fractionValue.denominator}`;
            fractionBar.style.width = `100%`; // Fill the container
            fractionBar.title = `Fraction: ${fractionBar.textContent}`; // Tooltip

            // Attach Fraction Data for Removal
            fractionBar.dataset.numerator = fractionValue.numerator;
            fractionBar.dataset.denominator = fractionValue.denominator;

            // Create Remove Button
            const removeBtn = document.createElement('span');
            removeBtn.classList.add('remove-fraction');
            removeBtn.textContent = '✖️'; // Unicode for "×"
            removeBtn.title = 'Remove this fraction';
            removeBtn.setAttribute('aria-label', 'Remove this fraction');

            // Append Fraction Bar and Remove Button to Dropped Fraction
            droppedFraction.appendChild(fractionBar);
            droppedFraction.appendChild(removeBtn);

            // Append to Row Content with Animation
            droppedFraction.style.opacity = 0;
            rowContent.appendChild(droppedFraction);
            setTimeout(() => {
                droppedFraction.style.transition = 'opacity 0.5s';
                droppedFraction.style.opacity = 1;
            }, 10);

            // Add Event Listener to Remove Button
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering parent events
                removeFractionFromRow(droppedFraction, targetRow);
            });

            // Update Row Total
            const simplifiedTotal = simplifyFraction(newTotalFraction);
            if (simplifiedTotal.denominator === 1) {
                rowTotalDisplay.textContent = `Total: ${simplifiedTotal.numerator}`;
            } else {
                rowTotalDisplay.textContent = `Total: ${simplifiedTotal.numerator}/${simplifiedTotal.denominator}`;
            }

            // Optional: Update Overall Fraction Sum
            updateOverallSum();

            // Provide Positive Feedback
            provideFeedback(`Added ${fractionBar.textContent} to ${targetRow.querySelector('.row-header').textContent}`);

            return true; // Fraction placed successfully
        }

        return false; // Fraction could not be placed in this row
    }

    // Function to Remove Fraction from a Row
    function removeFractionFromRow(fractionElement, row) {
        if (!row) {
            // If row is not provided, find the parent row
            row = fractionElement.closest('.grid-row');
        }

        const rowTotalDisplay = row.querySelector('.row-total');
        const fractionBar = fractionElement.querySelector('.fraction-bar');
        const fractionValue = { 
            numerator: parseInt(fractionBar.dataset.numerator, 10), 
            denominator: parseInt(fractionBar.dataset.denominator, 10) 
        };
        const currentTotalFraction = parseFraction(rowTotalDisplay.textContent.replace('Total: ', ''));
        const newTotalFraction = subtractFractions(currentTotalFraction, fractionValue);

        // Remove the fraction element with animation
        fractionElement.style.transition = 'opacity 0.5s';
        fractionElement.style.opacity = 0;
        setTimeout(() => {
            if (fractionElement.parentElement) {
                fractionElement.parentElement.removeChild(fractionElement);
            }
        }, 500);

        // Update Row Total
        if (newTotalFraction.numerator === 0) {
            rowTotalDisplay.textContent = `Total: 0`;
        } else if (newTotalFraction.denominator === 1) {
            rowTotalDisplay.textContent = `Total: ${newTotalFraction.numerator}`;
        } else {
            const simplifiedTotal = simplifyFraction(newTotalFraction);
            rowTotalDisplay.textContent = `Total: ${simplifiedTotal.numerator}/${simplifiedTotal.denominator}`;
        }

        // Update Overall Fraction Sum
        updateOverallSum();

        // Provide Feedback
        provideFeedback(`Removed ${fractionBar.textContent} from ${row.querySelector('.row-header').textContent}`);
    }

    // Control Panel Functionality
    eraseButton.addEventListener('click', () => {
        isErasing = !isErasing;
        updateControlModes();
    });

    resetButton.addEventListener('click', () => {
        resetGrid();
    });

    infoButton.addEventListener('click', () => {
        openModal();
    });

    // Modal Functionality
    closeButton.addEventListener('click', () => {
        closeModal();
    });

    window.addEventListener('click', (event) => {
        if (event.target === infoModal) {
            closeModal();
        }
    });

    function openModal() {
        infoModal.classList.add('show');
    }

    function closeModal() {
        infoModal.classList.remove('show');
    }

    // Update Control Modes (Erasing)
    function updateControlModes() {
        if (isErasing) {
            mainGrid.classList.add('erasing');
            eraseButton.style.backgroundColor = '#D32F2F'; // Change button color to indicate active state
            eraseButton.textContent = '🧹 Erasing';
        } else {
            mainGrid.classList.remove('erasing');
            eraseButton.style.backgroundColor = 'var(--color-accent)'; // Revert button color
            eraseButton.textContent = '🧹 Erase';
        }
    }

    // Reset Grid Functionality
    function resetGrid() {
        // Remove all dropped fractions with animation
        const droppedFractions = mainGrid.querySelectorAll('.dropped-fraction');
        droppedFractions.forEach(fraction => {
            fraction.style.transition = 'opacity 0.5s';
            fraction.style.opacity = 0;
            setTimeout(() => {
                if (fraction.parentElement) {
                    fraction.parentElement.removeChild(fraction);
                }
            }, 500);
        });

        // Reset row totals with delay to allow animations
        const rowTotals = mainGrid.querySelectorAll('.row-total');
        rowTotals.forEach(total => {
            setTimeout(() => {
                total.textContent = 'Total: 0';
            }, 500);
        });

        // Reset overall sum with delay
        setTimeout(() => {
            updateOverallSum();
        }, 600);

        // Reset Control Modes
        isErasing = false;
        updateControlModes();

        // Provide Feedback
        provideFeedback('Grid has been reset!');
    }

    // Calculate and Update Overall Fraction Sum (Optional)
    function updateOverallSum() {
        let sum = { numerator: 0, denominator: 1 };
        const rowTotals = mainGrid.querySelectorAll('.row-total');
        rowTotals.forEach(total => {
            const rowSumText = total.textContent.replace('Total: ', '');
            if (rowSumText === '0') return; // Skip if total is 0
            const [num, den] = rowSumText.split('/').map(Number);
            if (isNaN(num)) return; // Handle cases where total is an integer
            const fraction = isNaN(den) ? { numerator: num, denominator: 1 } : { numerator: num, denominator: den };
            sum = addFractions(sum, fraction);
        });
        const simplifiedSum = simplifyFraction(sum);
        if (simplifiedSum.numerator === 0) {
            fractionSumDisplay.textContent = `Overall Total: 0`;
        } else if (simplifiedSum.denominator === 1) {
            fractionSumDisplay.textContent = `Overall Total: ${simplifiedSum.numerator}`;
        } else {
            fractionSumDisplay.textContent = `Overall Total: ${simplifiedSum.numerator}/${simplifiedSum.denominator}`;
        }
    }

    // Fraction Arithmetic Functions

    /**
     * Parse Fraction from String
     * @param {string} fractionStr - Fraction string (e.g., "1/2")
     * @returns {Object} - Fraction object with numerator and denominator
     */
    function parseFraction(fractionStr) {
        if (fractionStr === '0') {
            return { numerator: 0, denominator: 1 };
        }
        const [numerator, denominator] = fractionStr.split('/').map(Number);
        return { numerator, denominator: denominator || 1 };
    }

    /**
     * Add Two Fractions
     * @param {Object} frac1 - First fraction
     * @param {Object} frac2 - Second fraction
     * @returns {Object} - Sum of fractions
     */
    function addFractions(frac1, frac2) {
        const commonDenominator = lcm(frac1.denominator, frac2.denominator);
        const adjustedNumerator1 = frac1.numerator * (commonDenominator / frac1.denominator);
        const adjustedNumerator2 = frac2.numerator * (commonDenominator / frac2.denominator);
        const sumNumerator = adjustedNumerator1 + adjustedNumerator2;
        return { numerator: sumNumerator, denominator: commonDenominator };
    }

    /**
     * Subtract frac2 from frac1
     * @param {Object} frac1 - First fraction
     * @param {Object} frac2 - Second fraction
     * @returns {Object} - Difference of fractions
     */
    function subtractFractions(frac1, frac2) {
        const commonDenominator = lcm(frac1.denominator, frac2.denominator);
        const adjustedNumerator1 = frac1.numerator * (commonDenominator / frac1.denominator);
        const adjustedNumerator2 = frac2.numerator * (commonDenominator / frac2.denominator);
        const diffNumerator = adjustedNumerator1 - adjustedNumerator2;
        return { numerator: diffNumerator, denominator: commonDenominator };
    }

    /**
     * Simplify Fraction
     * @param {Object} frac - Fraction to simplify
     * @returns {Object} - Simplified fraction
     */
    function simplifyFraction(frac) {
        if (frac.numerator === 0) {
            return { numerator: 0, denominator: 1 };
        }
        const gcdValue = gcd(Math.abs(frac.numerator), Math.abs(frac.denominator));
        return { numerator: frac.numerator / gcdValue, denominator: frac.denominator / gcdValue };
    }

    /**
     * Greatest Common Divisor (Euclidean Algorithm)
     * @param {number} a 
     * @param {number} b 
     * @returns {number} - GCD of a and b
     */
    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    /**
     * Least Common Multiple
     * @param {number} a 
     * @param {number} b 
     * @returns {number} - LCM of a and b
     */
    function lcm(a, b) {
        return (a * b) / gcd(a, b);
    }

    // Provide Feedback to User
    function provideFeedback(message) {
        // Create a temporary tooltip or notification
        const feedback = document.createElement('div');
        feedback.classList.add('feedback-message');
        feedback.textContent = message;
        document.body.appendChild(feedback);

        // Remove the feedback after 2.5 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentElement) {
                    feedback.parentElement.removeChild(feedback);
                }
            }, 500);
        }, 2500);
    }

    // Initialize the Game
    initFractionBars();
});

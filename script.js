document.addEventListener('DOMContentLoaded', () => {
    // Nav Toggle
    document.getElementById('nav-sgpa').addEventListener('click', () => switchApp('sgpa'));
    document.getElementById('nav-target').addEventListener('click', () => switchApp('target'));

    // SGPA App Events
    document.getElementById('btn-step1').addEventListener('click', goToStep2);
    document.getElementById('btn-add-subject').addEventListener('click', addSingleSubject);
    document.getElementById('btn-calculate').addEventListener('click', calculateSGPA);
    document.getElementById('btn-reset-partial').addEventListener('click', resetSGPA);
    document.getElementById('btn-restart').addEventListener('click', resetSGPA);

    // Target App Events
    document.getElementById('btn-calc-target').addEventListener('click', calculateTarget);

    // Alert Modal Event
    document.getElementById('btn-close-alert').addEventListener('click', closeAlert);
});

// ==========================================
// CUSTOM ALERT LOGIC
// ==========================================
function showAlert(message) {
    document.getElementById('alert-msg-content').innerText = message;
    document.getElementById('custom-alert').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('custom-alert').style.display = 'none';
}

// ==========================================
// NAVIGATION & DESCRIPTION LOGIC
// ==========================================
function switchApp(appName) {
    const sgpaBtn = document.getElementById('nav-sgpa');
    const targetBtn = document.getElementById('nav-target');
    const sgpaApp = document.getElementById('app-sgpa');
    const targetApp = document.getElementById('app-target');
    const description = document.getElementById('app-description');

    if (appName === 'sgpa') {
        sgpaBtn.classList.add('active');
        targetBtn.classList.remove('active');
        sgpaApp.style.display = 'block';
        targetApp.style.display = 'none';
        description.innerText = "Calculate your Semester Grade Point Average (SGPA) based on your subject marks and credits.";
    } else {
        targetBtn.classList.add('active');
        sgpaBtn.classList.remove('active');
        targetApp.style.display = 'block';
        sgpaApp.style.display = 'none';
        description.innerText = "Plan your future grades. Enter your current CGPA and target to find out what SGPA you need for the remaining semesters.";
    }
}

// ==========================================
// APP A: SGPA CALCULATOR
// ==========================================
let subjectCount = 0;

function getGradePoint(percentage) {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 55) return 6;
    if (percentage >= 50) return 5;
    if (percentage >= 40) return 4;
    return 0; 
}

function goToStep2() {
    const numInput = document.getElementById('numSubjects').value;
    const maxInput = document.getElementById('defaultMaxMarks').value;

    if (!numInput || numInput < 1) {
        showAlert("Please enter a valid number of subjects.");
        return;
    }
    if (!maxInput || maxInput <= 0) {
        showAlert("Please enter the default Max Marks.");
        return;
    }

    const num = parseInt(numInput);
    const max = parseInt(maxInput);

    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';
    subjectCount = 0;

    for (let i = 0; i < num; i++) {
        createSubjectRow(max);
    }

    switchStep('step1', 'step2');
}

function createSubjectRow(defaultMax) {
    subjectCount++;
    const container = document.getElementById('subjectsContainer');
    
    if (!defaultMax) {
        defaultMax = document.getElementById('defaultMaxMarks').value || 100;
    }

    const html = `
        <div class="subject-row">
            <div>
                <label>Subject ${subjectCount}</label>
                <input type="text" class="sub-name" placeholder="Name">
            </div>
            <div>
                <label>Marks Obtained</label>
                <input type="number" class="sub-marks" placeholder="0">
            </div>
            <div>
                <label>Max Marks</label>
                <input type="number" class="sub-max" value="${defaultMax}">
            </div>
            <div>
                <label>Credits</label>
                <input type="number" class="sub-credit" placeholder="Credit"> 
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addSingleSubject() {
    createSubjectRow();
}

function calculateSGPA() {
    const rows = document.querySelectorAll('.subject-row');
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    let hasError = false;

    if (rows.length === 0) {
        showAlert("Please add at least one subject.");
        return;
    }

    rows.forEach(row => {
        const marks = parseFloat(row.querySelector('.sub-marks').value);
        const maxMarks = parseFloat(row.querySelector('.sub-max').value);
        const credit = parseFloat(row.querySelector('.sub-credit').value);

        if (isNaN(marks) || isNaN(maxMarks) || isNaN(credit)) {
            hasError = true;
            row.style.border = "1px solid #ef4444";
            return;
        } else {
            row.style.border = "1px solid var(--border)";
        }
        
        if (maxMarks === 0) { hasError = true; return; }

        const percentage = (marks / maxMarks) * 100;
        const gradePoint = getGradePoint(percentage);

        totalWeightedPoints += (credit * gradePoint);
        totalCredits += credit;
    });

    if (hasError) {
        showAlert("Please check all fields. Make sure marks, max marks, and credits are valid.");
        return;
    }

    const sgpa = totalWeightedPoints / totalCredits;
    document.getElementById('finalScore').innerText = sgpa.toFixed(2);
    
    let msg = "";
    if(sgpa >= 9) msg = "Outstanding! 🎉";
    else if(sgpa >= 8) msg = "Excellent work! 🌟";
    else if(sgpa >= 7) msg = "Very Good! 👍";
    else if(sgpa >= 5) msg = "Passed. Keep pushing! 📚";
    else msg = "Try harder next time! 💪";
    
    document.getElementById('gradeMessage').innerText = msg;
    switchStep('step2', 'step3');
}

function resetSGPA() {
    document.getElementById('numSubjects').value = '';
    document.getElementById('defaultMaxMarks').value = '';
    switchStep('step3', 'step1');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step1').classList.add('active');
}

function switchStep(fromId, toId) {
    document.getElementById(fromId).classList.remove('active');
    document.getElementById(toId).classList.add('active');
}

// ==========================================
// APP B: TARGET CGPA CALCULATOR
// ==========================================
function calculateTarget() {
    const currentCGPA = parseFloat(document.getElementById('currentCGPA').value);
    const semsDone = parseFloat(document.getElementById('semestersDone').value);
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);
    const totalSems = parseFloat(document.getElementById('totalSemesters').value);

    // Validation
    if (isNaN(currentCGPA) || isNaN(semsDone) || isNaN(targetCGPA) || isNaN(totalSems)) {
        showAlert("Please fill in all fields.");
        return;
    }

    if (semsDone >= totalSems) {
        showAlert("Target semesters must be greater than semesters completed.");
        return;
    }

    const semsRemaining = totalSems - semsDone;
    
    const totalPointsNeeded = targetCGPA * totalSems;
    const currentPoints = currentCGPA * semsDone;
    const pointsRequiredRemaining = totalPointsNeeded - currentPoints;
    
    const requiredSGPA = pointsRequiredRemaining / semsRemaining;

    // Display
    const resultBox = document.getElementById('target-result-box');
    const valueDisplay = document.getElementById('requiredSGPA');
    const msgDisplay = document.getElementById('targetMessage');

    resultBox.style.display = 'block';
    valueDisplay.innerText = requiredSGPA.toFixed(2);

    if (requiredSGPA > 10) {
        valueDisplay.style.color = "#ef4444"; // Red
        msgDisplay.innerText = "This is statistically impossible (requires > 10 SGPA). You might need to lower your target.";
    } else if (requiredSGPA <= 0) {
        valueDisplay.style.color = "#10b981"; // Green
        msgDisplay.innerText = "You have already achieved this target! Just maintain decent grades.";
    } else {
        valueDisplay.style.color = "#6366f1"; // Primary
        msgDisplay.innerText = `You need to average ${requiredSGPA.toFixed(2)} SGPA for the next ${semsRemaining} semesters.`;
    }
}
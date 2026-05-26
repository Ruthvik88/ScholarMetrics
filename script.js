const gradeThresholds = [
    { gradePoint: 0, minPercentage: 0 },
    { gradePoint: 4, minPercentage: 40 },
    { gradePoint: 5, minPercentage: 50 },
    { gradePoint: 6, minPercentage: 55 },
    { gradePoint: 7, minPercentage: 60 },
    { gradePoint: 8, minPercentage: 70 },
    { gradePoint: 9, minPercentage: 80 },
    { gradePoint: 10, minPercentage: 90 }
];
const minimumSeePassMarks = 18;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nav-sgpa').addEventListener('click', () => switchApp('sgpa'));
    document.getElementById('nav-see').addEventListener('click', () => switchApp('see'));
    document.getElementById('nav-target').addEventListener('click', () => switchApp('target'));

    document.getElementById('btn-step1').addEventListener('click', goToStep2);
    document.getElementById('btn-add-subject').addEventListener('click', addSingleSubject);
    document.getElementById('btn-calculate').addEventListener('click', calculateSGPA);
    document.getElementById('btn-reset-partial').addEventListener('click', resetSGPA);
    document.getElementById('btn-restart').addEventListener('click', resetSGPA);
    document.getElementById('subjectsContainer').addEventListener('click', handleSgpaRowActions);

    document.getElementById('btn-see-step1').addEventListener('click', goToSeeStep2);
    document.getElementById('btn-add-see-subject').addEventListener('click', addSeeSubject);
    document.getElementById('btn-calculate-see').addEventListener('click', calculateSeeRequirements);
    document.getElementById('btn-reset-see').addEventListener('click', resetSeePlanner);
    document.getElementById('seeSubjectsContainer').addEventListener('click', handleSeeRowActions);

    document.getElementById('btn-calc-target').addEventListener('click', calculateTarget);
    document.getElementById('btn-go-see').addEventListener('click', () => switchApp('see'));
    document.getElementById('btn-close-alert').addEventListener('click', closeAlert);
});

function showAlert(message) {
    document.getElementById('alert-msg-content').innerText = message;
    document.getElementById('custom-alert').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('custom-alert').style.display = 'none';
}

function switchApp(appName) {
    const appConfig = {
        sgpa: {
            buttonId: 'nav-sgpa',
            appId: 'app-sgpa',
            description: 'Calculate your Semester Grade Point Average (SGPA) based on your subject marks and credits.'
        },
        see: {
            buttonId: 'nav-see',
            appId: 'app-see',
            description: 'Plan the marks you need in the Semester End Examination (SEE) using your mid-sem scores, credits, and CGPA goal.'
        },
        target: {
            buttonId: 'nav-target',
            appId: 'app-target',
            description: 'Plan your future grades. Enter your current CGPA and target to find out what SGPA you need for the remaining semesters.'
        }
    };

    Object.entries(appConfig).forEach(([key, config]) => {
        const button = document.getElementById(config.buttonId);
        const app = document.getElementById(config.appId);
        const isActive = key === appName;

        button.classList.toggle('active', isActive);
        app.style.display = isActive ? 'block' : 'none';
    });

    document.getElementById('app-description').innerText = appConfig[appName].description;
}

function switchStep(fromId, toId) {
    document.getElementById(fromId).classList.remove('active');
    document.getElementById(toId).classList.add('active');
}

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
    const numInput = parseInt(document.getElementById('numSubjects').value, 10);
    const maxInput = parseFloat(document.getElementById('defaultMaxMarks').value);

    if (isNaN(numInput) || numInput < 1) {
        showAlert('Please enter a valid number of subjects.');
        return;
    }

    if (isNaN(maxInput) || maxInput <= 0) {
        showAlert('Please enter the default max marks.');
        return;
    }

    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';

    for (let index = 0; index < numInput; index += 1) {
        createSubjectRow(maxInput);
    }

    switchStep('step1', 'step2');
}

function createSubjectRow(defaultMax) {
    const container = document.getElementById('subjectsContainer');
    const maxMarks = defaultMax || parseFloat(document.getElementById('defaultMaxMarks').value) || 100;
    const nextIndex = container.querySelectorAll('.subject-row').length + 1;

    const html = `
        <div class="subject-row">
            <div>
                <label class="subject-label">Subject ${nextIndex}</label>
                <input type="text" class="sub-name" placeholder="Name">
            </div>
            <div>
                <label>Marks Obtained</label>
                <input type="number" class="sub-marks" placeholder="0" min="0">
            </div>
            <div>
                <label>Max Marks</label>
                <input type="number" class="sub-max" value="${maxMarks}" min="1">
            </div>
            <div>
                <label>Credits</label>
                <input type="number" class="sub-credit" placeholder="Credit" min="0" step="0.5">
            </div>
            <div class="row-action-cell">
                <button type="button" class="btn-remove-row">Remove</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

function addSingleSubject() {
    createSubjectRow();
}

function handleSgpaRowActions(event) {
    if (!event.target.classList.contains('btn-remove-row')) {
        return;
    }

    event.target.closest('.subject-row').remove();
    renumberRows('subjectsContainer');
}

function renumberRows(containerId) {
    const rows = document.querySelectorAll(`#${containerId} .subject-row`);
    rows.forEach((row, index) => {
        const label = row.querySelector('.subject-label');
        if (label) {
            label.textContent = `Subject ${index + 1}`;
        }
    });
}

function calculateSGPA() {
    const rows = document.querySelectorAll('#subjectsContainer .subject-row');
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    let hasError = false;

    if (rows.length === 0) {
        showAlert('Please add at least one subject.');
        return;
    }

    rows.forEach((row) => {
        const marks = parseFloat(row.querySelector('.sub-marks').value);
        const maxMarks = parseFloat(row.querySelector('.sub-max').value);
        const credit = parseFloat(row.querySelector('.sub-credit').value);

        const isValid =
            !isNaN(marks) &&
            !isNaN(maxMarks) &&
            !isNaN(credit) &&
            maxMarks > 0 &&
            credit > 0 &&
            marks >= 0 &&
            marks <= maxMarks;

        row.classList.toggle('row-error', !isValid);

        if (!isValid) {
            hasError = true;
            return;
        }

        const percentage = (marks / maxMarks) * 100;
        const gradePoint = getGradePoint(percentage);

        totalWeightedPoints += credit * gradePoint;
        totalCredits += credit;
    });

    if (hasError || totalCredits === 0) {
        showAlert('Please check all fields. Make sure marks, max marks, and credits are valid.');
        return;
    }

    const sgpa = totalWeightedPoints / totalCredits;
    document.getElementById('finalScore').innerText = sgpa.toFixed(2);

    let message = '';
    if (sgpa >= 9) message = 'Outstanding performance.';
    else if (sgpa >= 8) message = 'Excellent work.';
    else if (sgpa >= 7) message = 'Very good. Keep it up.';
    else if (sgpa >= 5) message = 'You passed. Keep pushing forward.';
    else message = 'You need a stronger finish next time.';

    document.getElementById('gradeMessage').innerText = message;
    switchStep('step2', 'step3');
}

function resetSGPA() {
    document.getElementById('numSubjects').value = '';
    document.getElementById('defaultMaxMarks').value = '';
    document.getElementById('subjectsContainer').innerHTML = '';
    document.getElementById('finalScore').innerText = '0.00';
    document.getElementById('gradeMessage').innerText = '';

    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.remove('active');
}

function goToSeeStep2() {
    const numSubjects = parseInt(document.getElementById('seeNumSubjects').value, 10);
    const defaultMidMax = parseFloat(document.getElementById('defaultMidSemMaxMarks').value);
    const defaultSeeMax = parseFloat(document.getElementById('defaultSeeMaxMarks').value);

    if (isNaN(numSubjects) || numSubjects < 1) {
        showAlert('Please enter a valid number of subjects.');
        return;
    }

    if (isNaN(defaultMidMax) || defaultMidMax <= 0 || isNaN(defaultSeeMax) || defaultSeeMax <= 0) {
        showAlert('Please enter valid default mid-sem and SEE max marks.');
        return;
    }

    const container = document.getElementById('seeSubjectsContainer');
    container.innerHTML = '';

    for (let index = 0; index < numSubjects; index += 1) {
        createSeeSubjectRow(defaultMidMax, defaultSeeMax);
    }

    document.getElementById('see-result-box').style.display = 'none';
    switchStep('see-step1', 'see-step2');
}

function createSeeSubjectRow(defaultMidMax, defaultSeeMax) {
    const container = document.getElementById('seeSubjectsContainer');
    const midMax = defaultMidMax || parseFloat(document.getElementById('defaultMidSemMaxMarks').value) || 50;
    const seeMax = defaultSeeMax || parseFloat(document.getElementById('defaultSeeMaxMarks').value) || 50;
    const nextIndex = container.querySelectorAll('.subject-row').length + 1;

    const html = `
        <div class="subject-row">
            <div>
                <label class="subject-label">Subject ${nextIndex}</label>
                <input type="text" class="see-sub-name" placeholder="Name">
            </div>
            <div>
                <label>Mid-Sem Marks</label>
                <input type="number" class="see-mid-marks" placeholder="0" min="0">
            </div>
            <div>
                <label>Mid-Sem Max</label>
                <input type="number" class="see-mid-max" value="${midMax}" min="1">
            </div>
            <div>
                <label>SEE Max</label>
                <input type="number" class="see-max" value="${seeMax}" min="1">
            </div>
            <div>
                <label>Credits</label>
                <input type="number" class="see-credit" placeholder="Credit" min="0" step="0.5">
            </div>
            <div class="row-action-cell">
                <button type="button" class="btn-remove-row">Remove</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

function addSeeSubject() {
    createSeeSubjectRow();
}

function handleSeeRowActions(event) {
    if (!event.target.classList.contains('btn-remove-row')) {
        return;
    }

    event.target.closest('.subject-row').remove();
    renumberRows('seeSubjectsContainer');
}

function resetSeePlanner() {
    document.getElementById('seeNumSubjects').value = '';
    document.getElementById('defaultMidSemMaxMarks').value = '50';
    document.getElementById('defaultSeeMaxMarks').value = '50';
    document.getElementById('seeCurrentCGPA').value = '';
    document.getElementById('seeCompletedSemesters').value = '';
    document.getElementById('seeTargetCGPA').value = '';
    document.getElementById('seeSubjectsContainer').innerHTML = '';
    document.getElementById('seeRequiredSGPA').innerText = '0.00';
    document.getElementById('seeResultMessage').innerText = '';
    document.getElementById('seeBreakdown').innerHTML = '';
    document.getElementById('see-result-box').style.display = 'none';

    document.getElementById('see-step1').classList.add('active');
    document.getElementById('see-step2').classList.remove('active');
}

function calculateSeeRequirements() {
    const currentCGPA = parseFloat(document.getElementById('seeCurrentCGPA').value);
    const completedSemesters = parseInt(document.getElementById('seeCompletedSemesters').value, 10);
    const targetCGPA = parseFloat(document.getElementById('seeTargetCGPA').value);
    const rows = document.querySelectorAll('#seeSubjectsContainer .subject-row');

    if (rows.length === 0) {
        showAlert('Please add at least one subject.');
        return;
    }

    if (
        isNaN(currentCGPA) ||
        isNaN(completedSemesters) ||
        isNaN(targetCGPA) ||
        currentCGPA < 0 ||
        targetCGPA < 0 ||
        currentCGPA > 10 ||
        targetCGPA > 10 ||
        completedSemesters < 0
    ) {
        showAlert('Please enter valid CGPA inputs. CGPA should stay between 0 and 10.');
        return;
    }

    const subjects = [];
    let hasError = false;

    rows.forEach((row, index) => {
        const subjectName = row.querySelector('.see-sub-name').value.trim() || `Subject ${index + 1}`;
        const midMarks = parseFloat(row.querySelector('.see-mid-marks').value);
        const midMax = parseFloat(row.querySelector('.see-mid-max').value);
        const seeMax = parseFloat(row.querySelector('.see-max').value);
        const credit = parseFloat(row.querySelector('.see-credit').value);

        const isValid =
            !isNaN(midMarks) &&
            !isNaN(midMax) &&
            !isNaN(seeMax) &&
            !isNaN(credit) &&
            midMarks >= 0 &&
            midMax > 0 &&
            seeMax > 0 &&
            credit > 0 &&
            midMarks <= midMax;

        row.classList.toggle('row-error', !isValid);

        if (!isValid) {
            hasError = true;
            return;
        }

        subjects.push({
            name: subjectName,
            midMarks,
            midMax,
            seeMax,
            credit
        });
    });

    if (hasError) {
        showAlert('Please check every subject row. Mid-sem marks must be between 0 and the mid-sem maximum, and credits must be positive.');
        return;
    }

    const totalCredits = subjects.reduce((sum, subject) => sum + subject.credit, 0);
    const requiredSemesterSGPA =
        (targetCGPA * (completedSemesters + 1)) - (currentCGPA * completedSemesters);

    const planResult = findMinimumSeePlan(subjects, requiredSemesterSGPA, totalCredits);
    renderSeePlan({
        ...planResult,
        subjects,
        currentCGPA,
        completedSemesters,
        targetCGPA,
        totalCredits,
        requiredSemesterSGPA
    });
}

function findMinimumSeePlan(subjects, requiredSemesterSGPA, totalCredits) {
    const precision = 100;
    const targetScore = Math.max(0, Math.ceil((requiredSemesterSGPA * totalCredits * precision) - 1e-9));

    let states = new Map();
    states.set(0, {
        score: 0,
        totalSeeMarks: 0,
        peakSeeMarks: 0,
        selections: []
    });

    let maxScore = 0;

    subjects.forEach((subject) => {
        const options = buildSeeOptions(subject);
        const subjectMaxScore = Math.max(...options.map((option) => Math.round(option.gradePoint * subject.credit * precision)));
        maxScore += subjectMaxScore;

        const nextStates = new Map();

        states.forEach((state) => {
            options.forEach((option) => {
                const scoreGain = Math.round(option.gradePoint * subject.credit * precision);
                const nextScore = state.score + scoreGain;
                const nextCost = state.totalSeeMarks + option.requiredSeeMarks;
                const nextPeak = Math.max(state.peakSeeMarks, option.requiredSeeMarks);
                const nextSelections = state.selections.concat({
                    subjectName: subject.name,
                    credit: subject.credit,
                    requiredSeeMarks: option.requiredSeeMarks,
                    projectedGradePoint: option.gradePoint,
                    projectedPercentage: option.projectedPercentage,
                    seeMax: subject.seeMax
                });

                const existingState = nextStates.get(nextScore);
                const isBetterState =
                    !existingState ||
                    nextCost < existingState.totalSeeMarks ||
                    (nextCost === existingState.totalSeeMarks && nextPeak < existingState.peakSeeMarks);

                if (isBetterState) {
                    nextStates.set(nextScore, {
                        score: nextScore,
                        totalSeeMarks: nextCost,
                        peakSeeMarks: nextPeak,
                        selections: nextSelections
                    });
                }
            });
        });

        states = nextStates;
    });

    const finalStates = Array.from(states.values());
    const bestPlan = finalStates
        .filter((state) => state.score >= targetScore)
        .sort((left, right) => {
            if (left.totalSeeMarks !== right.totalSeeMarks) {
                return left.totalSeeMarks - right.totalSeeMarks;
            }

            if (left.peakSeeMarks !== right.peakSeeMarks) {
                return left.peakSeeMarks - right.peakSeeMarks;
            }

            return right.score - left.score;
        })[0] || null;

    return {
        bestPlan,
        maxAchievableSGPA: totalCredits === 0 ? 0 : maxScore / (totalCredits * precision)
    };
}

function buildSeeOptions(subject) {
    const totalMaxMarks = subject.midMax + subject.seeMax;
    const rawOptions = gradeThresholds
        .map((threshold) => {
            const minimumTotalMarks = (threshold.minPercentage / 100) * totalMaxMarks;
            const requiredSeeMarks = Math.max(
                minimumSeePassMarks,
                Math.ceil(minimumTotalMarks - subject.midMarks - 1e-9)
            );

            if (requiredSeeMarks > subject.seeMax) {
                return null;
            }

            return {
                gradePoint: threshold.gradePoint,
                requiredSeeMarks,
                projectedPercentage: ((subject.midMarks + requiredSeeMarks) / totalMaxMarks) * 100
            };
        })
        .filter(Boolean);

    const optimizedOptions = [];
    let lowestCostSeen = Number.POSITIVE_INFINITY;

    for (let index = rawOptions.length - 1; index >= 0; index -= 1) {
        const option = rawOptions[index];
        if (option.requiredSeeMarks < lowestCostSeen) {
            optimizedOptions.push(option);
            lowestCostSeen = option.requiredSeeMarks;
        }
    }

    return optimizedOptions.reverse();
}

function renderSeePlan(result) {
    const resultBox = document.getElementById('see-result-box');
    const valueDisplay = document.getElementById('seeRequiredSGPA');
    const messageDisplay = document.getElementById('seeResultMessage');
    const breakdown = document.getElementById('seeBreakdown');
    const semesterNumber = result.completedSemesters + 1;
    const safeRequiredSGPA = Math.max(0, result.requiredSemesterSGPA);

    resultBox.style.display = 'block';
    valueDisplay.innerText = safeRequiredSGPA.toFixed(2);
    breakdown.innerHTML = '';

    if (result.requiredSemesterSGPA > 10) {
        valueDisplay.style.color = '#ef4444';
        messageDisplay.innerText = `You would need ${result.requiredSemesterSGPA.toFixed(2)} SGPA in semester ${semesterNumber}, which is above the grading scale.`;
        breakdown.innerHTML = `<p class="see-note">Even a perfect semester cannot take you to ${result.targetCGPA.toFixed(2)} CGPA after semester ${semesterNumber}.</p>`;
        return;
    }

    if (!result.bestPlan) {
        valueDisplay.style.color = '#ef4444';
        messageDisplay.innerText = `This target is not reachable with the current mid-sem marks. Your best possible semester SGPA is ${result.maxAchievableSGPA.toFixed(2)}.`;
        breakdown.innerHTML = `<p class="see-note">Try lowering the target CGPA or improving subjects where the SEE still has room to lift your grade point.</p>`;
        return;
    }

    const achievedSGPA = result.bestPlan.score / (result.totalCredits * 100);
    const totalSeeMarks = result.bestPlan.totalSeeMarks;
    const averageSeeMarks = totalSeeMarks / result.bestPlan.selections.length;

    if (result.requiredSemesterSGPA <= 0) {
        valueDisplay.style.color = '#10b981';
        messageDisplay.innerText = `Your CGPA target is already secured mathematically. This plan shows the minimum SEE marks needed to stay on track after semester ${semesterNumber}.`;
    } else {
        valueDisplay.style.color = '#4f46e5';
        messageDisplay.innerText = `You need at least ${result.requiredSemesterSGPA.toFixed(2)} SGPA this semester to finish semester ${semesterNumber} at ${result.targetCGPA.toFixed(2)} CGPA.`;
    }

    const breakdownHtml = result.bestPlan.selections
        .map((selection) => `
            <div class="see-breakdown-item">
                <div class="see-breakdown-head">
                    <strong>${escapeHtml(selection.subjectName)}</strong>
                    <span>${selection.requiredSeeMarks}/${selection.seeMax} in SEE</span>
                </div>
                <p>
                    Credit ${selection.credit},
                    projected grade point ${selection.projectedGradePoint},
                    projected total ${selection.projectedPercentage.toFixed(1)}%.
                </p>
            </div>
        `)
        .join('');

    breakdown.innerHTML = `
        <div class="see-summary">
            <p>Planned semester SGPA: <strong>${achievedSGPA.toFixed(2)}</strong></p>
            <p>Total SEE marks in this minimum plan: <strong>${totalSeeMarks}</strong></p>
            <p>Average SEE marks needed: <strong>${averageSeeMarks.toFixed(2)}/50</strong> per subject</p>
        </div>
        <div class="see-breakdown-list">
            ${breakdownHtml}
        </div>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return replacements[character];
    });
}

function calculateTarget() {
    const currentCGPA = parseFloat(document.getElementById('currentCGPA').value);
    const semestersDone = parseFloat(document.getElementById('semestersDone').value);
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);
    const totalSemesters = parseFloat(document.getElementById('totalSemesters').value);

    if (isNaN(currentCGPA) || isNaN(semestersDone) || isNaN(targetCGPA) || isNaN(totalSemesters)) {
        showAlert('Please fill in all fields.');
        return;
    }

    if (semestersDone >= totalSemesters) {
        showAlert('Target semesters must be greater than semesters completed.');
        return;
    }

    const semestersRemaining = totalSemesters - semestersDone;
    const totalPointsNeeded = targetCGPA * totalSemesters;
    const currentPoints = currentCGPA * semestersDone;
    const pointsRequiredRemaining = totalPointsNeeded - currentPoints;
    const requiredSGPA = pointsRequiredRemaining / semestersRemaining;

    const resultBox = document.getElementById('target-result-box');
    const valueDisplay = document.getElementById('requiredSGPA');
    const messageDisplay = document.getElementById('targetMessage');

    resultBox.style.display = 'block';
    valueDisplay.innerText = requiredSGPA.toFixed(2);

    if (requiredSGPA > 10) {
        valueDisplay.style.color = '#ef4444';
        messageDisplay.innerText = 'This target is not reachable because it needs more than 10 SGPA on average.';
    } else if (requiredSGPA <= 0) {
        valueDisplay.style.color = '#10b981';
        messageDisplay.innerText = 'You have already crossed this target mathematically. Maintain consistent grades from here.';
    } else {
        valueDisplay.style.color = '#4f46e5';
        messageDisplay.innerText = `You need to average ${requiredSGPA.toFixed(2)} SGPA across the next ${semestersRemaining} semesters.`;
    }
}

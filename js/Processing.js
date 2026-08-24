/* ---------- shared helpers ---------- */

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function getParam(name) {
    return new URLSearchParams(
        window.location.search
    ).get(name);
}

function firstNameOf(name) {
    return (name || 'User').split(' ')[0];
}

function initialsFromName(name) {

    const parts =
        (name || 'User')
            .trim()
            .split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .charAt(0)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[1].charAt(0)
    ).toUpperCase();
}

async function currentUser() {
    try {
        const res = await fetch('http://127.0.0.1:8000/auth/me', { credentials: 'include' });
        if (!res.ok) return { name: 'Guest', email: '', loggedIn: false };
        const data = await res.json();
        return { name: data.name, email: data.email, loggedIn: true };
    } catch (e) {
        return { name: 'Guest', email: '', loggedIn: false };
    }
}


/* ---------- navigation ---------- */

async function renderNav(context) {

    const navMid = $('navMid');
    const navRight = $('navRight');

    if (context === 'guest') {

        if (navMid) {
            navMid.style.display = 'flex';
        }

        if (navRight) {

            navRight.innerHTML = `
                <button
                    class="nav-ghost"
                    type="button"
                    onclick="location.href='login.html'"
                >
                    Log In
                </button>

                <button
                    class="nav-btn"
                    type="button"
                    onclick="location.href='login.html'"
                >
                    Get Started
                </button>
            `;
        }

    } else if (context === 'login') {

        if (navMid) {
            navMid.style.display = 'none';
        }

        if (navRight) {

            navRight.innerHTML = `
                <button
                    class="nav-ghost"
                    type="button"
                    onclick="location.href='index.html'"
                >
                    Back to home
                </button>
            `;
        }

    } else {

        if (navMid) {
            navMid.style.display = 'none';
        }

        const user = await currentUser();

        const initials =
            initialsFromName(
                user.name || 'User'
            );

        if (navRight) {

            navRight.innerHTML = `
                <div class="nav-user">

                    <div class="avatar">
                        ${initials}
                    </div>

                    <span class="nav-user-name">
                        ${escapeHtml(
                            firstNameOf(
                                user.name || 'User'
                            )
                        )}
                    </span>

                </div>

                <button
                    class="nav-ghost"
                    type="button"
                    onclick="location.href='index.html'"
                >
                    Log out
                </button>
            `;
        }
    }
}


/* =========================================================
   GET FILE FROM INDEXED DB
========================================================= */

function getFileForProcessing() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                'UpsellXDB',
                1
            );


        request.onsuccess =
            function (event) {

                const db =
                    event.target.result;

                const transaction =
                    db.transaction(
                        'files',
                        'readonly'
                    );

                const store =
                    transaction.objectStore(
                        'files'
                    );

                const requestFile =
                    store.get(
                        'currentFile'
                    );


                requestFile.onsuccess =
                    function () {

                        db.close();

                        resolve(
                            requestFile.result
                        );
                    };


                requestFile.onerror =
                    function () {

                        db.close();

                        reject(
                            requestFile.error
                        );
                    };
            };


        request.onerror =
            function () {

                reject(
                    request.error
                );
            };
    });
}


/* =========================================================
   CALL FASTAPI ML MODEL
========================================================= */

async function callMLModel(file) {

    console.log(
        'Sending file to ML model:',
        file.name
    );

    const formData =
        new FormData();

    formData.append(
        'file',
        file
    );

    const response =
        await fetch(
            'http://127.0.0.1:8000/api/predict',
            {
                method: 'POST',
                body: formData,
                credentials: 'include'
            }
        );

    console.log(
        'ML API status:',
        response.status
    );

    if (!response.ok) {

        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: await response.text() };
        }

        console.error(
            'ML API error:',
            errorData
        );

        const detailMsg = typeof errorData.detail === 'object' && errorData.detail !== null
            ? (errorData.detail.message || JSON.stringify(errorData.detail))
            : errorData.detail;

        const err = new Error(detailMsg || `ML API returned ${response.status}`);
        err.detail = errorData.detail;
        err.status = response.status;
        throw err;
    }

    const result =
        await response.json();

    console.log(
        '========== ML RESULT =========='
    );

    console.log(
        result
    );

    console.log(
        '================================'
    );

    return result;
}


/* =========================================================
   SAVE RESULT IN BROWSER
========================================================= */

function saveMLResult(result) {

    sessionStorage.setItem(
        'upsellResults',
        JSON.stringify(result)
    );

    console.log(
        'ML result saved in sessionStorage'
    );
}


/* =========================================================
   GO TO DASHBOARD
========================================================= */

function goToDashboard() {

    console.log(
        'Opening Dashboard...'
    );

    location.href =
        'Dashboard.html';
}


/* =========================================================
   UPDATE PROCESSING UI
========================================================= */

function setTaskState(idx, state) {

    const row =
        $('taskrow' + idx);

    if (!row) {
        return;
    }

    row.className =
        'taskrow ' +
        (state === 'pending'
            ? ''
            : state);


    const icon =
        row.querySelector('.ticon');

    const status =
        row.querySelector('.tstatus');


    if (state === 'done') {

        icon.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;

        status.textContent =
            'Done';

    } else if (state === 'current') {

        icon.innerHTML = `
            <svg
                class="spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="3"
                stroke-linecap="round"
            >
                <path d="M12 2v4"/>
                <path d="M12 18v4"/>
                <path d="M4.9 4.9l2.8 2.8"/>
                <path d="M16.3 16.3l2.8 2.8"/>
                <path d="M2 12h4"/>
                <path d="M18 12h4"/>
                <path d="M4.9 19.1l2.8-2.8"/>
                <path d="M16.3 7.7l2.8-2.8"/>
            </svg>
        `;

        status.textContent =
            'Running';

    } else {

        icon.innerHTML = '';

        status.textContent =
            'Pending';
    }
}


/* =========================================================
   PROGRESS UI
========================================================= */

function updateProgressUI(progress) {

    const ringVal =
        $('ringVal');

    const ringProgress =
        $('ringProgress');


    if (ringVal) {

        ringVal.textContent =
            Math.round(progress) + '%';
    }


    if (ringProgress) {

        ringProgress.setAttribute(
            'stroke-dashoffset',
            (
                490.09 *
                (1 - progress / 100)
            ).toFixed(2)
        );
    }
}


const THRESH = [
    15,
    35,
    55,
    75,
    90,
    100
];


function updateTasksByProgress(progress) {

    for (let i = 1; i <= 6; i++) {

        const previousThreshold =
            i === 1
                ? 0
                : THRESH[i - 2];


        if (
            progress >=
            THRESH[i - 1]
        ) {

            setTaskState(
                i,
                'done'
            );

        } else if (
            progress >=
            previousThreshold
        ) {

            setTaskState(
                i,
                'current'
            );

        } else {

            setTaskState(
                i,
                'pending'
            );
        }
    }
}


/* =========================================================
   ERROR MODAL
========================================================= */

function showErrorModal(techDetailMessage, likelyReasonText) {

    const reason = likelyReasonText || `The uploaded file may be missing required columns, use different
        column names, or contain corrupted rows. Double-check it matches the
        expected CDR format, then try uploading again.`;

    $('modalTitle').innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:9px; color:#8c2424;">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#8c2424" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
            </svg>
            Processing failed
        </span>
    `;

    $('modalBody').innerHTML = `
        <p>We couldn't generate predictions for this file.</p>
        <h4>Likely reason</h4>
        <p>${escapeHtml(reason)}</p>
        <h4>Technical detail</h4>
        <p>${escapeHtml(techDetailMessage)}</p>
    `;

    $('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    $('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function handleOverlayClick(e) {
    if (e.target.id === 'modalOverlay') closeModal();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

function skipProcessing() {
    location.href = 'Dashboard.html';
}

function showRetryButton() {
    const btn = $('skipBtn');
    if (!btn) return;

    btn.textContent = 'Upload file again';

    btn.onclick = function () {
        location.href = 'upload.html';
    };
}

function resetProcessingUI() {

    updateProgressUI(0);

    for (let i = 1; i <= 6; i++) {
        setTaskState(i, 'pending');
    }
}


/* =========================================================
   MAIN PROCESS
========================================================= */

async function runProcessing() {

    let climbInterval;

    try {

        console.log(
            'Processing started...'
        );

        let progress = 5;

        updateProgressUI(progress);
        updateTasksByProgress(progress);

        const file =
            await getFileForProcessing();

        if (!file) {
            throw new Error(
                'No uploaded file found.'
            );
        }

        console.log(
            'File retrieved:',
            file.name
        );

        const procSub =
            $('procSub');

        if (procSub) {
            procSub.innerHTML =
                'Sending <strong>' +
                escapeHtml(file.name) +
                '</strong> to the ML model...';
        }

        climbInterval = setInterval(() => {

            if (progress < 90) {

                progress += Math.random() * 4 + 1.5;
                progress = Math.min(progress, 90);

                updateProgressUI(progress);
                updateTasksByProgress(progress);
            }

        }, 350);

        const result =
            await callMLModel(file);

        clearInterval(climbInterval);

        console.log(
            'Prediction received successfully.'
        );

        updateProgressUI(100);
        updateTasksByProgress(100);

        saveMLResult(result);

        console.log(
            'Processing complete.'
        );

        setTimeout(
            goToDashboard,
            500
        );

    } catch (error) {

        console.error(
            'PROCESSING ERROR:',
            error
        );

        if (climbInterval) {
            clearInterval(climbInterval);
        }

        resetProcessingUI();
        showRetryButton();

        const procSub =
            $('procSub');

        if (procSub) {
            procSub.innerHTML =
                '<strong>Processing failed.</strong> ' +
                escapeHtml(
                    error.message
                );
        }

        let likelyReason;
        if (error.detail && typeof error.detail === 'object') {
            likelyReason = error.detail.message;
        } else if (typeof error.detail === 'string') {
            likelyReason = error.detail;
        } else {
            likelyReason = error.message;
        }

        const techDetail = error.status ? `ML API returned status code ${error.status}` : (error.message || 'ML API call failed');

        showErrorModal(techDetail, likelyReason);
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

async function initPage() {

    await renderNav('auth');

    const fileName =
        getParam('file');

    if (
        fileName &&
        $('procSub')
    ) {

        $('procSub').innerHTML =
            'Sit tight while we send <strong>' +
            escapeHtml(fileName) +
            '</strong> to the ML model.';
    }

    runProcessing();
}

initPage();
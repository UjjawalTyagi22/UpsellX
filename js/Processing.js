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

function currentUser() {

    const demo =
        getParam('demo') === '1';

    const name =
        getParam('name') ||
        (demo ? 'Ananya Rao' : 'Guest');

    const email =
        getParam('email') ||
        (demo
            ? 'ananya.rao@upsellx-demo.com'
            : '');

    return {
        name,
        email,
        demo,
        loggedIn: !!name
    };
}


/* ---------- navigation ---------- */

function renderNav(context) {

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

        const user = currentUser();

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


    /*
     * FormData sends the CSV file
     * to FastAPI.
     */
    const formData =
        new FormData();

    formData.append(
        'file',
        file
    );


    /*
     * THIS IS THE ACTUAL API CALL.
     */
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

        const errorText =
            await response.text();

        console.error(
            'ML API error:',
            errorText
        );

        throw new Error(
            `ML API returned ${response.status}`
        );
    }


    /*
     * Get actual ML result.
     */
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
   MAIN PROCESS
========================================================= */

async function runProcessing() {

    try {

        console.log(
            'Processing started...'
        );


        /* -----------------------------------------
           STEP 1 — Get CSV from IndexedDB
        ----------------------------------------- */

        updateProgressUI(5);

        updateTasksByProgress(5);


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


        /* -----------------------------------------
           STEP 2 — Update UI
        ----------------------------------------- */

        updateProgressUI(20);

        updateTasksByProgress(20);


        const procSub =
            $('procSub');


        if (procSub) {

            procSub.innerHTML =
                'Sending <strong>' +
                escapeHtml(file.name) +
                '</strong> to the ML model...';
        }


        /* -----------------------------------------
           STEP 3 — CALL ML API
        ----------------------------------------- */

        updateProgressUI(30);

        updateTasksByProgress(30);


        const result =
            await callMLModel(file);


        /* -----------------------------------------
           STEP 4 — REAL RESULT RECEIVED
        ----------------------------------------- */

        console.log(
            'Prediction received successfully.'
        );


        updateProgressUI(80);

        updateTasksByProgress(80);


        /* -----------------------------------------
           STEP 5 — SAVE RESULT
        ----------------------------------------- */

        saveMLResult(result);


        updateProgressUI(95);

        updateTasksByProgress(95);


        /* -----------------------------------------
           STEP 6 — Complete
        ----------------------------------------- */

        updateProgressUI(100);

        updateTasksByProgress(100);


        console.log(
            'Processing complete.'
        );


        /*
         * Give UI a small moment to show 100%.
         */
        setTimeout(
            goToDashboard,
            500
        );


    } catch (error) {

        console.error(
            'PROCESSING ERROR:',
            error
        );


        /*
         * Show error in browser console.
         */
        const procSub =
            $('procSub');


        if (procSub) {

            procSub.innerHTML =
                '<strong>Processing failed.</strong> ' +
                escapeHtml(
                    error.message
                );
        }


        /*
         * Don't automatically go
         * to Dashboard if ML failed.
         */
        alert(
            'ML prediction failed. Check the browser console.'
        );
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

renderNav('auth');


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
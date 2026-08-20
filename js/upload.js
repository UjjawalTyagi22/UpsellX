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
    return new URLSearchParams(window.location.search).get(name);
}

function firstNameOf(name) {
    return (name || 'User').split(' ')[0];
}

function initialsFromName(name) {
    const parts = (name || 'User').trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[1].charAt(0)
    ).toUpperCase();
}

function currentUser() {
    const demo = getParam('demo') === '1';

    const name =
        getParam('name') ||
        (demo ? 'Ananya Rao' : 'Guest');

    const email =
        getParam('email') ||
        (demo ? 'ananya.rao@upsellx-demo.com' : '');

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

        const initials = initialsFromName(
            user.name || 'User'
        );

        if (navRight) {
            navRight.innerHTML = `
                <div class="nav-user">
                    <div class="avatar">${initials}</div>

                    <span class="nav-user-name">
                        ${escapeHtml(firstNameOf(user.name || 'User'))}
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


/* ---------- upload state ---------- */

const state = {
    file: null,
    fileName: '',
    fileSizeText: '',
    rowCount: null
};


/* ---------- drag & drop ---------- */

function handleDragOver(e) {

    e.preventDefault();

    e.currentTarget.classList.add(
        'drag-active'
    );
}


function handleDragLeave(e) {

    e.currentTarget.classList.remove(
        'drag-active'
    );
}


function handleDrop(e) {

    e.preventDefault();

    e.currentTarget.classList.remove(
        'drag-active'
    );

    const file =
        e.dataTransfer.files &&
        e.dataTransfer.files[0];

    if (file) {
        processSelectedFile(file);
    }
}


function onFileInputChange(e) {

    const file =
        e.target.files &&
        e.target.files[0];

    if (file) {
        processSelectedFile(file);
    }
}


/* ---------- file validation ---------- */

function processSelectedFile(file) {

    const ext =
        file.name
            .split('.')
            .pop()
            .toLowerCase();

    const error = $('uploadError');

    if (!['csv', 'xlsx', 'xls'].includes(ext)) {

        error.textContent =
            'Unsupported file type. Please upload a .csv or .xlsx file.';

        error.style.display = 'block';

        return;
    }

    if (file.size > 25 * 1024 * 1024) {

        error.textContent =
            'File is larger than 25MB. Please upload a smaller file.';

        error.style.display = 'block';

        return;
    }

    error.style.display = 'none';

    parseFile(file, ext);
}


/* ---------- file parsing ---------- */

function parseFile(file, ext) {

    state.file = file;
    state.fileName = file.name;
    state.fileSizeText = formatBytes(file.size);
    state.rowCount = null;

    showFilePreview();

    if (ext === 'csv') {

        const reader = new FileReader();

        reader.onload = e => {

            const lines =
                String(e.target.result)
                    .split(/\r\n|\n/)
                    .filter(line => line.trim().length > 0);

            state.rowCount =
                Math.max(0, lines.length - 1);
        };

        reader.readAsText(file);

    } else {

        const reader = new FileReader();

        reader.onload = e => {

            try {

                const data =
                    new Uint8Array(e.target.result);

                const workbook =
                    XLSX.read(data, {
                        type: 'array'
                    });

                const worksheet =
                    workbook.Sheets[
                        workbook.SheetNames[0]
                    ];

                const range =
                    XLSX.utils.decode_range(
                        worksheet['!ref']
                    );

                state.rowCount =
                    Math.max(
                        0,
                        range.e.r - range.s.r
                    );

            } catch (error) {

                state.rowCount = null;
            }
        };

        reader.readAsArrayBuffer(file);
    }
}


/* ---------- preview ---------- */

function formatBytes(bytes) {

    if (bytes < 1024) {
        return bytes + ' B';
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
        return kb.toFixed(1) + ' KB';
    }

    return (kb / 1024).toFixed(1) + ' MB';
}


function showFilePreview() {

    $('fpName').textContent =
        state.fileName;

    $('fpSize').textContent =
        state.fileSizeText +
        ' · Ready to process';

    $('filePreview').style.display =
        'flex';

    $('continueBtn').disabled =
        false;
}


function removeFile() {

    state.file = null;
    state.fileName = '';
    state.rowCount = null;

    $('filePreview').style.display =
        'none';

    $('continueBtn').disabled =
        true;

    $('fileInput').value = '';

    $('uploadError').style.display =
        'none';
}


/* ---------- save file in browser ---------- */

function saveFileForProcessing(file) {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                'UpsellXDB',
                1
            );

        request.onupgradeneeded =
            function (event) {

                const db =
                    event.target.result;

                if (!db.objectStoreNames.contains('files')) {

                    db.createObjectStore(
                        'files'
                    );
                }
            };


        request.onsuccess =
            function (event) {

                const db =
                    event.target.result;

                const transaction =
                    db.transaction(
                        'files',
                        'readwrite'
                    );

                const store =
                    transaction.objectStore(
                        'files'
                    );

                store.put(
                    file,
                    'currentFile'
                );


                transaction.oncomplete =
                    function () {

                        db.close();

                        resolve();
                    };


                transaction.onerror =
                    function () {

                        db.close();

                        reject(
                            transaction.error
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


/* ---------- Continue button ---------- */

async function continueToProcessing() {

    if (!state.file) {
        return;
    }

    const button =
        $('continueBtn');

    try {

        button.disabled = true;

        /*
         * Store the uploaded CSV temporarily
         * in browser IndexedDB.
         */
        await saveFileForProcessing(
            state.file
        );

        /*
         * Immediately open Processing page.
         */
        location.href =
            'Processing.html';

    } catch (error) {

        console.error(
            'Error saving file:',
            error
        );

        const uploadError =
            $('uploadError');

        uploadError.textContent =
            'Could not prepare the file. Please try again.';

        uploadError.style.display =
            'block';

        button.disabled =
            false;
    }
}


/* ---------- page initialization ---------- */

renderNav('auth');
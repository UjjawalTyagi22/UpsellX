async function handleSignup() {
    const name = document.getElementById("suName").value;
    const email = document.getElementById("suEmail").value;
    const password = document.getElementById("suPassword").value;

    const response = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail);
        return;
    }

    alert("Signup successful. Please login.");

    window.location.href = "login.html";
}
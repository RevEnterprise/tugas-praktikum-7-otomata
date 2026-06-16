function processFSM() {
    const input = document.getElementById("inputString").value;
    const lang = document.getElementById("language").value;

    const resultBox = document.getElementById("resultBox");
    const history = document.getElementById("history");
    const resultText = document.getElementById("resultText");

    let steps = [];

    let result = false;
    let reason = "";

    if (lang === "anbn") {
        ({result, steps, reason} = PDA_anbn(input));
    }
    else if (lang === "anbn_star") {
        ({result, steps, reason} = PDA_anbn_star(input));
    }
    else if (lang === "aabn") {
        ({result, steps, reason} = PDA_aabn(input));
    }

    if (result) {
        resultBox.innerHTML = "✅ ACCEPTED";
        resultText.innerHTML = "String diterima";
    } else {
        resultBox.innerHTML = "❌ REJECTED";
        resultText.innerHTML = "String ditolak: " + reason;
    }

    history.innerHTML = steps.join("");
}


function PDA_anbn(input) {
    let stack = ["Z"];
    let state = "q0";
    let steps = [];
    let reason = "";

    for (let char of input) {
        let prevStack = stack.join("");

        if (char === 'a') {
            if (state === "q1") {
                return {result:false, steps, reason:"a setelah b tidak boleh"};
            }
            stack.push("A");
        }
        else if (char === 'b') {
            state = "q1";
            if (stack[stack.length-1] === "A") {
                stack.pop();
            } else {
                return {result:false, steps, reason:"b terlalu banyak"};
            }
        }
        else {
            return {result:false, steps, reason:"hanya a dan b"};
        }

        steps.push(`<div class="step">${char} | Stack: ${prevStack} → ${stack.join("")}</div>`);
    }

    if (stack.length === 1) {
        return {result:true, steps, reason:""};
    } else {
        return {result:false, steps, reason:"a terlalu banyak"};
    }
}


function PDA_anbn_star(input) {
    let stack = ["Z"];
    let steps = [];
    let countA = 0;
    let countB = 0;

    for (let char of input) {
        if (char === 'a') {
            countA++;
        }
        else if (char === 'b') {
            countB++;
        }
        else {
            return {result:false, steps, reason:"hanya a dan b"};
        }

        steps.push(`<div class="step">${char} | a=${countA}, b=${countB}</div>`);

        if (countB > countA) {
            return {result:false, steps, reason:"b lebih banyak dari a"};
        }

        if (countA === countB) {
            countA = 0;
            countB = 0;
            steps.push(`<div class="step"><b>Segment valid (reset)</b></div>`);
        }
    }

    if (countA === 0 && countB === 0) {
        return {result:true, steps, reason:""};
    } else {
        return {result:false, steps, reason:"tidak selesai pasangan"};
    }
}


function PDA_aabn(input) {
    let steps = [];

    if (input.length < 2 || input[0] !== 'a' || input[1] !== 'a') {
        return {result:false, steps, reason:"harus diawali aa"};
    }

    steps.push(`<div class="step">Awal valid: aa</div>`);

    for (let i = 2; i < input.length; i++) {
        if (input[i] !== 'b') {
            return {result:false, steps, reason:"setelah aa hanya boleh b"};
        }
        steps.push(`<div class="step">b diterima</div>`);
    }

    return {result:true, steps, reason:""};
}


function resetAll() {
    document.getElementById("inputString").value = "";
    document.getElementById("resultBox").innerHTML = "Menunggu input...";
    document.getElementById("history").innerHTML = "Belum ada proses.";
    document.getElementById("resultText").innerHTML = "Belum dicek.";
}
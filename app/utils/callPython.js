
const child_process = require("child_process");
const { spawn } = child_process;
const runPythonWithData = (script, args) => {
    return new Promise((resolve, reject) => {
        const process = spawn("python3", [script, ...args]);
        let output = "";

        process.stdout.on("data", (data) => (output += data.toString()));
        process.stderr.on("data", (data) => console.error(data.toString()));

        process.on("close", (code) => {
            if (code === 0) resolve(output);
            else reject(new Error("Python process failed"));
        });

    });
};


module.exports = {
    runPythonWithData: runPythonWithData
};
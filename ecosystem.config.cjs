module.exports = {
    apps: [
        {
            name: "taxi-hgo-api-dev-3011",
            script: "npm",
            args: ["run", "start"],
            exec_mode: "fork",
            instances: 1,
            watch: false
        }
    ]
};
/* module.exports = {
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
}; */

module.exports = {
    apps: [
        {
            name: "taxi-hgo-api-dev-3011",
            script: "npm",
            args: ["run", "start"],
            exec_mode: "cluster",
            max_memory_restart: "700M",
            autorestart: true,
            instances: 4,
            watch: false
        }
    ]
};
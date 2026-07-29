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
            cwd: __dirname,
            script: "./dist/server.js",
            exec_mode: "cluster",
            instances: 4,
            autorestart: true,
            watch: false,
            max_memory_restart: "700M",
            error_file: "./logs/api-error.log",
            out_file: "./logs/api-out.log",
            merge_logs: true,
            time: true
        }
    ]
};
export function setupNodeProcessHandlers({ fastifyInstance }) {
    async function shutdown(reasonOrError) {
        console.log(`⚠️ Process shutting down... Reason:`, reasonOrError);

        if (fastifyInstance) {
            try {
                await fastifyInstance.close();
                console.log("✅ Fastify closed gracefully.");
            }
            catch ( fastifyCloseErr ) {
                console.error("❌ Fastify close error:", fastifyCloseErr);
            }
        }

        if (process.env.NODE_ENV === "production") {
            process.exit(1);
        } else {
            console.log("🛠️ Dev mode — not exiting process.");
        }
    }

    // Remove previous handlers first:
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("uncaughtException");
    process.removeAllListeners("unhandledRejection");

    // SYNTAX : process.on(eventName, handlerFunction);
    // So we passing a handle function reference

    // Wrap it in an arrow function if you want to pass your own custom arguments:
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // Pass the function directly (if you want Node’s arguments):
    process.on("uncaughtException", shutdown);
    process.on("unhandledRejection", shutdown);
}
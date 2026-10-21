import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
  ssr: {
    noExternal: [
      "@refriq/api",
      "@refriq/application",
      "@refriq/domain",
      "@refriq/contracts",
    ],
  },
  plugins:
    process.env.REFRIQ_REVIEWER_TEST_SERVER === "1"
      ? [
          {
            name: "reviewer-test-boundary",
            configureServer(server) {
              server.middlewares.use(async (req, res, next) => {
                if (
                  !["/api/reviewer", "/__reviewer_test"].includes(
                    req.url?.split("?")[0],
                  )
                )
                  return next();
                try {
                  const module = await server.ssrLoadModule(
                    "/../api/test/dev-server.ts",
                  );
                  let body = "";
                  for await (const chunk of req) body += chunk;
                  const request = new Request(`http://127.0.0.1${req.url}`, {
                    method: req.method,
                    headers: { "content-type": "application/json" },
                    ...(body ? { body } : {}),
                  });
                  const response = await module.handleTestRequest(request);
                  res.statusCode = response.status;
                  response.headers.forEach((value, key) => {
                    res.setHeader(key, value);
                  });
                  res.end(await response.text());
                } catch (error) {
                  server.config.logger.error(String(error));
                  res.statusCode = 500;
                  res.end("test boundary error");
                }
              });
            },
          },
        ]
      : [],
});

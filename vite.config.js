import { defineConfig } from "vite";

// Maps clean URLs to their HTML files — mirrors the rewrites in vercel.json
const routes = {
    "/about": "/about/index.html",
    "/projects": "/projects/index.html",
    "/admin": "/admin/index.html",
    "/contact": "/index.html",
    "/products": "/index.html",
    "/services": "/index.html",
    "/home": "/index.html",
};

function mpaRouting() {
    return {
        name: "mpa-routing",
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                const url = req.url?.split("?")[0];
                if (url && routes[url]) req.url = routes[url];
                next();
            });
        },
        configurePreviewServer(server) {
            server.middlewares.use((req, _res, next) => {
                const url = req.url?.split("?")[0];
                if (url && routes[url]) req.url = routes[url];
                next();
            });
        },
    };
}

export default defineConfig({
    root: ".",
    publicDir: false,
    plugins: [mpaRouting()],
    server: { port: 4173 },
    preview: { port: 4173 },
    build: {
        rollupOptions: {
            input: {
                main: "./index.html",
                about: "./about/index.html",
                projects: "./projects/index.html",
            },
        },
    },
});

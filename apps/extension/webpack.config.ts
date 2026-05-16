import path from "path";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";
import type { Configuration } from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Configuration = {
  entry: {
    "background/index": "./src/background/index.ts",
    "content/index": "./src/content/index.ts",
    "popup/index": "./src/popup/index.tsx",
    "options/index": "./src/options/Options.tsx",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@security-copilot/shared-types": path.resolve(
        __dirname,
        "../../packages/shared-types/src"
      ),
    },
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/popup/index.html", to: "popup/index.html" },
        { from: "src/options/index.html", to: "options/index.html" },
      ],
    }),
  ],

  optimization: {
    splitChunks: false,
  },
};

export default config;
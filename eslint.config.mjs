import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
  {
    rules: {
      // 非同期ポーリング(fetch→setState)を誤検知するため警告に緩和
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;

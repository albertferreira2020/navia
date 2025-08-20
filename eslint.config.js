import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
    js.configs.recommended,
    {
        plugins: {
            prettier,
        },
        rules: {
            ...prettierConfig.rules,
            "prettier/prettier": "off",
            "indent": "off",
            "no-mixed-spaces-and-tabs": "off",
            "no-trailing-spaces": "off",
            "quotes": "off",
            "semi": "off",
            "comma-dangle": "off",
            "brace-style": "off",
            "object-curly-spacing": "off",
            "array-bracket-spacing": "off",
            "space-before-blocks": "off",
            "space-infix-ops": "off",
            "space-unary-ops": "off",
            "keyword-spacing": "off",
            "space-before-function-paren": "off",
            "eol-last": "off",
            "no-multiple-empty-lines": "off",
            "padded-blocks": "off",
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                document: "readonly",
                window: "readonly",
            },
        },
    },
];

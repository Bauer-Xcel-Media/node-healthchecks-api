module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "jest/globals": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2017
    },
    "plugins": [
        "jsdoc",
        "jest"
    ],
    "globals": {
        "BDU_NODE_AUTHORIZATION": true,
        "IS_AUTH": true,
    },
    "rules": {
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "max-len": [
            "error",
            {
                "code": 120,
                "ignoreComments": true
            }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "jsdoc/check-param-names": 1,
        "jsdoc/check-tag-names": 1,
        "jsdoc/check-types": 1,
        "jsdoc/newline-after-description": 1,
        "jsdoc/require-description-complete-sentence": 1,
        "jsdoc/require-example": 0,
        "jsdoc/require-hyphen-before-param-description": 1,
        "jsdoc/require-param": 1,
        "jsdoc/require-param-description": 1,
        "jsdoc/require-param-name": 1,
        "jsdoc/require-param-type": 1,
        "jsdoc/require-returns-description": 1,
        "jsdoc/require-returns-type": 1
    },
    "settings": {
        "jsdoc": {
            "additionalTagNames": {
                "customTags": ["async", "extends"]
            }
        }
    }
};
